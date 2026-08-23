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
    // TS7 无 JS compiler API，Next 需直接调用本地 tsc CLI（P0A 验证项）
    useTypeScriptCli: true,
  },
};

export default withMDX(nextConfig);
