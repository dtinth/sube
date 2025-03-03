/**
 * Timeline row structure including subtitles
 */
export interface TimelineRow {
  startTime: number; // ms
  endTime: number; // ms
  startPoint: number;
  pointCount: number; 
  width: number; // px
  subtitles: SubtitleSegment[];
}

/**
 * A subtitle segment displayed in a row
 */
export interface SubtitleSegment {
  id: string;
  start: number; // ms
  end: number; // ms
  text: string;
  startOffsetInRow: number; // px
  width: number; // px
}

/**
 * Configuration for timeline visualization
 */
export interface TimelineConfig {
  barWidth: number;
  pointsPerRow: number;
  msPerPoint: number;
}

/**
 * Subtitle cue structure as used in the application
 */
export interface SubtitleCue {
  id?: string;
  start: number; // ms
  end: number; // ms
  text: string;
  settings?: string;
}