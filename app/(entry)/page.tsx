import { DocsHome } from '@/components/docs-home';

/** Root is the x-default entry and renders the complete default-language home without redirecting. */
export default function EntryPage() {
  return <DocsHome lang="zh" />;
}
