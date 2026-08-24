import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { CategoryDirectory } from '@/components/category-directory';
import { DocsPortal } from '@/components/docs-portal';
import { QuickStartGuide } from '@/components/quick-start-guide';
import { VideoEmbed } from '@/components/video-embed';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CategoryDirectory,
    DocsPortal,
    QuickStartGuide,
    VideoEmbed,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
