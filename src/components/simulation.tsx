"use client"

import { useEffect, useRef } from "react"

type Color = "dark" | "light"

const COLORS: Record<Color, string> = {
	dark: "#0f172a",
	light: "#f1f5f9"
}

type BallTrail = {
	x: number
	y: number
	opacity: number
}

type Ball = {
	x: number
	y: number
	dx: number
	dy: number
	color: Color
	trail: BallTrail[]
}

type SimulationProps = {
	gridSize: number
	squareSize: number
	ballSpeed: number
	speedRatio: number
}

export const Simulation = ({
	gridSize,
	squareSize,
	ballSpeed,
	speedRatio
}: SimulationProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const animationRef = useRef<number | null>(null)

	const ballRadius = squareSize / 2
	const canvasSize = gridSize * squareSize

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		// Initialize grid
		const grid: Color[][] = Array(gridSize)
			.fill(null)
			.map(() => Array(gridSize).fill(null as unknown as Color))
		for (let y = 0; y < gridSize; y++) {
			for (let x = 0; x < gridSize; x++) {
				grid[y][x] = x < gridSize / 2 ? "dark" : "light"
			}
		}

		// Initialize balls
		const balls: Ball[] = [
			{
				x: canvasSize * 0.25,
				y: canvasSize / 2,
				color: "light",
				dx: ballSpeed * Math.cos(Math.random() * Math.PI * 2),
				dy: ballSpeed * Math.sin(Math.random() * Math.PI * 2),
				trail: []
			},
			{
				x: canvasSize * 0.75,
				y: canvasSize / 2,
				color: "dark",
				dx: ballSpeed * Math.cos(Math.random() * Math.PI * 2),
				dy: ballSpeed * Math.sin(Math.random() * Math.PI * 2),
				trail: []
			}
		]

		function drawGrid() {
			if (!ctx) throw new Error("Canvas context not initialized")

			for (let y = 0; y < gridSize; y++) {
				for (let x = 0; x < gridSize; x++) {
					ctx.fillStyle = COLORS[grid[y][x]]
					ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize)
				}
			}
		}

		function drawBall(ball: Ball) {
			if (!ctx) throw new Error("Canvas context not initialized")

			for (const point of ball.trail) {
				ctx.beginPath()
				ctx.arc(point.x, point.y, ballRadius, 0, Math.PI * 2)
				ctx.fillStyle = `${COLORS[ball.color]}${Math.floor(point.opacity * 255)
					.toString(16)
					.padStart(2, "0")}`
				ctx.fill()
				ctx.closePath()
			}

			ctx.beginPath()
			ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2)
			ctx.fillStyle = COLORS[ball.color]
			ctx.fill()
			ctx.closePath()
		}

		function checkCircleSquareCollision(
			circleX: number,
			circleY: number,
			radius: number,
			squareX: number,
			squareY: number,
			squareSize: number
		) {
			const closestX = Math.max(
				squareX,
				Math.min(circleX, squareX + squareSize)
			)
			const closestY = Math.max(
				squareY,
				Math.min(circleY, squareY + squareSize)
			)

			const distanceX = circleX - closestX
			const distanceY = circleY - closestY

			return distanceX * distanceX + distanceY * distanceY <= radius * radius
		}

		function updateBall(ball: Ball) {
			const opacity = 0.1

			// Add multiple trail points between current and next position
			const steps = 4 // Number of intermediate points
			for (let i = 0; i < steps; i++) {
				ball.trail.unshift({
					x: ball.x + (ball.dx * i) / steps,
					y: ball.y + (ball.dy * i) / steps,
					opacity
				})
			}

			const maxTrailLength = 16
			while (ball.trail.length > maxTrailLength) {
				ball.trail.pop()
			}

			let i = 0
			for (const point of ball.trail) {
				point.opacity = opacity * (1 - i / maxTrailLength)
				i++
			}

			let ownSquares = 0
			for (let y = 0; y < gridSize; y++) {
				for (let x = 0; x < gridSize; x++) {
					if (grid[y][x] === ball.color) {
						ownSquares++
					}
				}
			}

			const totalSquares = gridSize * gridSize
			const ratio = ownSquares / totalSquares
			const speedMultiplier =
				1 / speedRatio + (speedRatio - 1 / speedRatio) * ratio

			const angle = Math.atan2(ball.dy, ball.dx)
			const targetSpeed = ballSpeed * speedMultiplier

			ball.dx = targetSpeed * Math.cos(angle)
			ball.dy = targetSpeed * Math.sin(angle)

			const nextX = ball.x + ball.dx
			const nextY = ball.y + ball.dy

			const potentialGridCells = []

			const minGridX = Math.max(
				0,
				Math.floor((nextX - ballRadius) / squareSize)
			)
			const maxGridX = Math.min(
				gridSize - 1,
				Math.floor((nextX + ballRadius) / squareSize)
			)
			const minGridY = Math.max(
				0,
				Math.floor((nextY - ballRadius) / squareSize)
			)
			const maxGridY = Math.min(
				gridSize - 1,
				Math.floor((nextY + ballRadius) / squareSize)
			)

			for (let y = minGridY; y <= maxGridY; y++) {
				for (let x = minGridX; x <= maxGridX; x++) {
					if (grid[y][x] === ball.color) {
						const squareX = x * squareSize
						const squareY = y * squareSize
						if (
							checkCircleSquareCollision(
								nextX,
								nextY,
								ballRadius,
								squareX,
								squareY,
								squareSize
							)
						) {
							potentialGridCells.push({ x, y, squareX, squareY })
						}
					}
				}
			}

			if (potentialGridCells.length > 0) {
				const collision = potentialGridCells[0]

				const centerX = collision.squareX + squareSize / 2
				const centerY = collision.squareY + squareSize / 2

				if (Math.abs(ball.x - centerX) > Math.abs(ball.y - centerY)) {
					ball.dx *= -1
				} else {
					ball.dy *= -1
				}

				grid[collision.y][collision.x] =
					ball.color === "dark" ? "light" : "dark"
			} else {
				ball.x = nextX
				ball.y = nextY
			}

			if (ball.x - ballRadius <= 0 || ball.x + ballRadius >= canvasSize) {
				ball.dx *= -1
				ball.x = Math.max(ballRadius, Math.min(canvasSize - ballRadius, ball.x))
			}
			if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= canvasSize) {
				ball.dy *= -1
				ball.y = Math.max(ballRadius, Math.min(canvasSize - ballRadius, ball.y))
			}
		}

		function animate() {
			if (!ctx) throw new Error("Canvas context not initialized")

			ctx.clearRect(0, 0, canvasSize, canvasSize)

			drawGrid()
			for (const ball of balls) {
				updateBall(ball)
				drawBall(ball)
			}

			animationRef.current = requestAnimationFrame(animate)
		}

		animate()

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current)
			}
		}
	}, [ballRadius, ballSpeed, gridSize, squareSize, canvasSize, speedRatio])

	return <canvas ref={canvasRef} width={canvasSize} height={canvasSize} />
}
