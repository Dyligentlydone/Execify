import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // @ts-expect-error - optimizeFonts is valid but missing from NextConfig type in this version
  optimizeFonts: false,
};

export default nextConfig;
