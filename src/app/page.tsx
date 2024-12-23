import { Simulation } from "@/components/simulation"
import { cn } from "@/lib/utils"

export default function Page() {
	return (
		<div className={cn("scale-[0.6]", "md:scale-100")}>
			<Simulation gridSize={32} squareSize={16} ballSpeed={4} speedRatio={4} />
		</div>
	)
}
