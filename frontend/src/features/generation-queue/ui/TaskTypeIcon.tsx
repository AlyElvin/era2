import { FileText, ImageIcon, Music, Video, type LucideIcon } from "lucide-react";
import type { GenType } from "@/entities/generation-task";

export interface TaskTypeIconProps {
  type: GenType;
  className?: string;
}

const ICONS: Record<GenType, LucideIcon> = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  audio: Music,
};

/** Иконка типа генерации (текст / изображение / видео / аудио). */
export function TaskTypeIcon({ type, className }: TaskTypeIconProps): React.ReactElement {
  const Icon = ICONS[type];
  return <Icon className={className} aria-hidden="true" />;
}
