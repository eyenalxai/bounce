import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	reactStrictMode: true,
	transpilePackages: ["geist"]
}

module.exports = nextConfig
