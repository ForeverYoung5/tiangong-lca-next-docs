import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const nextConfig: NextConfig = {
  // This repository maintains its own governed AGENTS.md contract.
  // Prevent `next dev` from appending generated agent rules to the tracked file.
  agentRules: false,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    // TypeScript 7 has no JavaScript compiler API; use the local tsc CLI.
    useTypeScriptCli: true,
  },
};

export default withMDX(nextConfig);
