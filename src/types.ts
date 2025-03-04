import { SubtitleCue } from "./utils/timeline/types";

export interface ProjectData {
  waveform?: number[];
  subtitles?: SubtitleCue[];
  audioBlobId?: string;
  isVideo?: boolean;
}

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  data?: ProjectData;
}