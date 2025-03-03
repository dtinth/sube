import { Card, Flex, Text } from "@radix-ui/themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { projectStore } from "../../stores/projectStore";
import { SubtitleCue } from "./ImportSubtitleModal";

interface ProjectContentProps {
  projectId: string;
}

// Constants for waveform visualization
const BAR_WIDTH = 8; // pixels
const POINTS_PER_ROW = 150; // 15 seconds (100ms per point)
const ROW_HEIGHT = 120; // pixels (increased to accommodate subtitles)
const WAVEFORM_HEIGHT = 60; // pixels
const ROW_GAP = 20; // pixels
const VISIBLE_BUFFER = 2; // extra rows to render above and below viewport
const MS_PER_POINT = 100; // each point represents 100ms

/**
 * Timeline row structure including subtitles that handles smart wrapping
 */
interface TimelineRow {
  startTime: number; // ms
  endTime: number; // ms
  startPoint: number;
  pointCount: number; 
  width: number; // px
  subtitles: SubtitleSegment[];
}

/**
 * A subtitle segment that may be split across rows
 */
interface SubtitleSegment {
  id: string;
  start: number; // ms
  end: number; // ms
  text: string;
  startOffsetInRow: number; // px
  width: number; // px
  isStart: boolean; // true if this is the start of the subtitle
  isEnd: boolean; // true if this is the end of the subtitle
}

/**
 * Displays the main content area of the project
 * Shows waveform and subtitles data as a timeline visualization
 */
const ProjectContent: React.FC<ProjectContentProps> = ({ projectId }) => {
  const { currentProject } = useStore(projectStore);
  const waveform = currentProject?.data?.waveform as number[] | undefined;
  const subtitles = currentProject?.data?.subtitles as SubtitleCue[] | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState<[number, number]>([0, 10]);

  // Prepare timeline rows with smart wrapping for subtitles
  const timelineRows = useMemo(() => {
    if (!waveform) return [];

    const rows: TimelineRow[] = [];
    const totalPoints = waveform.length;
    
    // Sort subtitles by start time
    const sortedSubtitles = subtitles ? [...subtitles].sort((a, b) => a.start - b.start) : [];
    
    // First pass: create basic rows without subtitle wrapping
    let currentPoint = 0;
    let rowIndex = 0;
    
    while (currentPoint < totalPoints) {
      const startPoint = currentPoint;
      const pointsInRow = Math.min(POINTS_PER_ROW, totalPoints - currentPoint);
      const startTime = startPoint * MS_PER_POINT;
      const endTime = startTime + (pointsInRow * MS_PER_POINT);
      
      rows.push({
        startTime,
        endTime,
        startPoint,
        pointCount: pointsInRow,
        width: pointsInRow * BAR_WIDTH,
        subtitles: []
      });
      
      currentPoint += pointsInRow;
      rowIndex++;
    }
    
    // Second pass: assign subtitles to rows and handle wrapping
    if (sortedSubtitles.length > 0) {
      // For each subtitle, find which row(s) it belongs to
      sortedSubtitles.forEach((subtitle, index) => {
        // Find the row where this subtitle starts
        let startRowIndex = rows.findIndex(row => 
          subtitle.start >= row.startTime && subtitle.start < row.endTime
        );
        
        if (startRowIndex === -1) {
          // If the subtitle starts before the timeline, place it in the first row
          startRowIndex = Math.max(0, rows.findIndex(row => subtitle.end >= row.startTime && subtitle.end < row.endTime));
          if (startRowIndex === -1) return; // Skip if completely outside the timeline
        }
        
        // Find the row where this subtitle ends
        let endRowIndex = rows.findIndex(row => 
          subtitle.end > row.startTime && subtitle.end <= row.endTime
        );
        
        if (endRowIndex === -1) {
          // If the subtitle ends after the timeline, place it in the last row
          endRowIndex = rows.length - 1;
        }
        
        // If the subtitle spans multiple rows but not too many, try to move it entirely to the next row
        if (startRowIndex !== endRowIndex && (endRowIndex - startRowIndex <= 1)) {
          if (startRowIndex < rows.length - 1) {
            // Move to next row to avoid splitting
            startRowIndex++;
            if (endRowIndex < startRowIndex) endRowIndex = startRowIndex;
          }
        }
        
        // If this subtitle is longer than one row, we need to extend the row to fit it
        if (startRowIndex === endRowIndex) {
          const row = rows[startRowIndex];
          const subtitleDuration = subtitle.end - subtitle.start;
          const rowDuration = row.endTime - row.startTime;
          
          if (subtitleDuration > rowDuration) {
            // Extend this row to fit the entire subtitle
            const newEndTime = Math.max(row.endTime, subtitle.end);
            const newPointCount = Math.ceil((newEndTime - row.startTime) / MS_PER_POINT);
            
            row.endTime = newEndTime;
            row.pointCount = newPointCount;
            row.width = newPointCount * BAR_WIDTH;
          }
          
          // Add the subtitle to this row
          const startOffsetInRow = Math.max(0, (subtitle.start - row.startTime) / MS_PER_POINT * BAR_WIDTH);
          const durationInRow = subtitle.end - Math.max(subtitle.start, row.startTime);
          const width = (durationInRow / MS_PER_POINT) * BAR_WIDTH;
          
          row.subtitles.push({
            id: subtitle.id || `subtitle-${index}`,
            start: subtitle.start,
            end: subtitle.end,
            text: subtitle.text,
            startOffsetInRow,
            width,
            isStart: true,
            isEnd: true
          });
        } else {
          // Split the subtitle across multiple rows
          for (let i = startRowIndex; i <= endRowIndex; i++) {
            const row = rows[i];
            let segmentStart = i === startRowIndex ? subtitle.start : row.startTime;
            let segmentEnd = i === endRowIndex ? subtitle.end : row.endTime;
            
            const startOffsetInRow = Math.max(0, (segmentStart - row.startTime) / MS_PER_POINT * BAR_WIDTH);
            const durationInRow = segmentEnd - Math.max(segmentStart, row.startTime);
            const width = (durationInRow / MS_PER_POINT) * BAR_WIDTH;
            
            row.subtitles.push({
              id: subtitle.id || `subtitle-${index}`,
              start: subtitle.start,
              end: subtitle.end,
              text: subtitle.text,
              startOffsetInRow,
              width,
              isStart: i === startRowIndex,
              isEnd: i === endRowIndex
            });
          }
        }
      });
    }
    
    return rows;
  }, [waveform, subtitles]);

  // Calculate total height of the timeline
  const totalHeight = timelineRows.reduce((sum, _) => sum + ROW_HEIGHT + ROW_GAP, 0);

  // Update visible rows based on scroll position
  useEffect(() => {
    if (timelineRows.length === 0 || !containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, clientHeight } = container;
      const rowHeight = ROW_HEIGHT + ROW_GAP;
      
      // Calculate visible row range with buffer
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - VISIBLE_BUFFER);
      const endRow = Math.min(
        timelineRows.length - 1,
        Math.ceil((scrollTop + clientHeight) / rowHeight) + VISIBLE_BUFFER
      );
      
      setVisibleRows([startRow, endRow]);
    };

    // Initialize visible rows
    handleScroll();

    // Add scroll listener
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [timelineRows]);

  // Render a single row of the timeline
  const renderRow = (rowIndex: number) => {
    if (!waveform || timelineRows.length === 0 || rowIndex >= timelineRows.length) return null;
    
    const row = timelineRows[rowIndex];
    const rowPoints = waveform.slice(row.startPoint, row.startPoint + row.pointCount);
    
    // Calculate the top position of this row
    const rowTop = timelineRows.slice(0, rowIndex).reduce((sum, _) => sum + ROW_HEIGHT + ROW_GAP, 0);
    
    return (
      <div 
        key={rowIndex}
        style={{
          position: 'absolute',
          top: rowTop,
          left: 0,
          width: `${row.width}px`,
          height: `${ROW_HEIGHT}px`,
          backgroundColor: rowIndex % 2 === 0 ? 'var(--gray-1)' : 'transparent',
          borderBottom: '1px solid var(--gray-3)'
        }}
      >
        {/* Time label for each row */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          fontSize: '10px', 
          color: 'var(--gray-10)',
          padding: '2px 4px',
          backgroundColor: 'var(--gray-2)',
          borderRadius: '2px',
          zIndex: 1
        }}>
          {formatTime(row.startTime / 1000)}
        </div>
        
        {/* Render waveform */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: `${WAVEFORM_HEIGHT}px`, display: 'flex', alignItems: 'flex-end' }}>
          {rowPoints.map((value, i) => (
            <div
              key={i}
              style={{
                width: `${BAR_WIDTH - 1}px`,
                height: `${Math.max(1, value * WAVEFORM_HEIGHT)}px`,
                backgroundColor: 'var(--accent-9)',
                marginRight: '1px'
              }}
            />
          ))}
        </div>
        
        {/* Render subtitles */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${ROW_HEIGHT - WAVEFORM_HEIGHT}px` }}>
          {row.subtitles.map((subtitle, index) => (
            <div
              key={`${subtitle.id}-${index}`}
              style={{
                position: 'absolute',
                left: `${subtitle.startOffsetInRow}px`,
                top: '20px',
                width: `${subtitle.width}px`,
                padding: '4px',
                backgroundColor: 'var(--accent-3)',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: '1px solid var(--accent-6)',
                boxSizing: 'border-box'
              }}
            >
              {subtitle.text}
              {!subtitle.isStart && <span style={{ position: 'absolute', left: 0, top: 0, fontSize: '16px' }}>←</span>}
              {!subtitle.isEnd && <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px' }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format time in seconds to MM:SS.ms format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <Card size="3" style={{ minHeight: "400px" }}>
      <Flex direction="column" gap="2" width="100%">
        <Text color="gray" size="2">
          Project ID: {projectId}
        </Text>
        
        {waveform ? (
          <>
            <Text size="4">Timeline</Text>
            <Text size="2" color="gray" mb="2">
              Waveform: {waveform.length} points ({(waveform.length / 10).toFixed(1)} seconds)
              {subtitles && ` • Subtitles: ${subtitles.length} cues`}
            </Text>
            
            {/* Timeline container with virtualized rows */}
            <div 
              ref={containerRef}
              style={{
                width: '100%',
                height: '500px',
                position: 'relative',
                overflow: 'auto',
                border: '1px solid var(--gray-4)',
                borderRadius: 'var(--radius-2)'
              }}
            >
              {/* Container for absolute positioning */}
              <div style={{ 
                height: `${totalHeight}px`, 
                position: 'relative',
                minWidth: '100%'
              }}>
                {/* Only render visible rows */}
                {timelineRows.length > 0 && Array.from(
                  { length: Math.min(visibleRows[1] - visibleRows[0] + 1, timelineRows.length) },
                  (_, i) => renderRow(i + visibleRows[0])
                )}
              </div>
            </div>
          </>
        ) : (
          <Flex direction="column" align="center" justify="center" gap="4" height="300px">
            <Text size="4" color="gray">
              No timeline data available.
            </Text>
            <Text color="gray">
              Use the "Import Waveform" and "Import Subtitles" options from the menu.
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default ProjectContent;