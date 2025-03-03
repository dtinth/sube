import { SubtitleCue, TimelineConfig, TimelineRow } from "./types";

/**
 * Creates timeline rows from waveform and subtitle data
 *
 * @param waveform - Array of waveform amplitude values (0-1)
 * @param subtitles - Array of subtitle cues
 * @param config - Timeline configuration
 * @returns Array of timeline rows
 */
export function createTimelineRows(
  waveform?: number[],
  subtitles?: SubtitleCue[],
  config: TimelineConfig = {
    barWidth: 8,
    pointsPerRow: 150,
    msPerPoint: 100,
  }
): TimelineRow[] {
  if (!waveform) return [];

  const { barWidth, pointsPerRow, msPerPoint } = config;
  const rows: TimelineRow[] = [];
  const totalPoints = waveform.length;

  // Sort subtitles by start time
  const sortedSubtitles = subtitles
    ? [...subtitles].sort((a, b) => a.start - b.start)
    : [];

  // First pass part 1: determine starting points for each row
  const startingPoints: number[] = [];
  let currentPoint = 0;

  while (currentPoint < totalPoints) {
    startingPoints.push(currentPoint);
    currentPoint += pointsPerRow;
  }

  // First pass part 2: create basic rows without subtitles using the starting points
  for (let i = 0; i < startingPoints.length; i++) {
    const startPoint = startingPoints[i];
    const nextStartPoint =
      i < startingPoints.length - 1 ? startingPoints[i + 1] : totalPoints;
    const pointsInRow = nextStartPoint - startPoint;
    const startTime = startPoint * msPerPoint;
    const endTime = startTime + pointsInRow * msPerPoint;

    rows.push({
      startTime,
      endTime,
      startPoint,
      pointCount: pointsInRow,
      width: pointsInRow * barWidth,
      subtitles: [],
    });
  }

  // Second pass: assign subtitles to only the row that contains their starting point
  if (sortedSubtitles.length > 0) {
    // For each subtitle, find the row where it starts
    sortedSubtitles.forEach((subtitle, index) => {
      // Find the row where this subtitle starts
      let rowIndex = rows.findIndex(
        (row) => subtitle.start >= row.startTime && subtitle.start < row.endTime
      );

      if (rowIndex === -1) {
        // If the subtitle starts before the timeline, place it in the first row
        rowIndex = 0;
        if (subtitle.end < rows[0].startTime) return; // Skip if completely outside the timeline
      }

      const row = rows[rowIndex];

      // Add the subtitle to this row with full width
      const startOffsetInRow = Math.max(
        0,
        ((subtitle.start - row.startTime) / msPerPoint) * barWidth
      );
      const width = ((subtitle.end - subtitle.start) / msPerPoint) * barWidth;

      row.subtitles.push({
        id: subtitle.id || `subtitle-${index}`,
        start: subtitle.start,
        end: subtitle.end,
        text: subtitle.text,
        startOffsetInRow,
        width,
      });
    });
  }

  return rows;
}
