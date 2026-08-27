export interface VideoEmbedProps {
  /** 嵌入源 URL（如 bilibili 播放器） */
  src: string;
  /** Required accessible title for the embedded video frame. */
  title: string;
}

/**
 * Type-safe, accessible video embedding for public MDX pages.
 */
export function VideoEmbed({ src, title }: VideoEmbedProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
