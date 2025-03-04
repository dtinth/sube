import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TimelineRow, TimelinePlayhead } from "./TimelineComponents";
import SubtitleOverlay, { SubtitleOverlayRef } from "./SubtitleOverlay";

interface TimelineContainerProps {
  timelineRows: Array<any>;
  waveform: number[] | undefined;
  audioBlob: Blob | null;
  currentTime: number;
  onTimeClick: (newTime: number) => void;
  barWidth: number;
  rowHeight: number;
  rowGap: number;
  waveformHeight: number;
  msPerPoint: number;
  children?: React.ReactNode;
}

interface TimelineContainerRef {
  editActiveSubtitle: () => boolean;
}

const TimelineContainer = React.memo(
  React.forwardRef<TimelineContainerRef, TimelineContainerProps>(
  ({
    timelineRows,
    waveform,
    audioBlob,
    currentTime,
    onTimeClick,
    barWidth,
    rowHeight,
    rowGap,
    waveformHeight,
    msPerPoint,
    children,
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const subtitleOverlayRef = useRef<SubtitleOverlayRef>(null);
    const [visibleRows, setVisibleRows] = useState<[number, number]>([0, 10]);
    const [activeSubtitleId, setActiveSubtitleId] = useState<string | null>(null);

    // Calculate total height of the timeline
    const totalHeight = useMemo(() => {
      return timelineRows.reduce((sum, _) => sum + rowHeight + rowGap, 0);
    }, [timelineRows, rowHeight, rowGap]);

    // Update active subtitle based on current time
    useEffect(() => {
      if (!timelineRows.length || currentTime <= 0) return;

      // Find all subtitles across all rows
      const allSubtitles = timelineRows.flatMap((row) => row.subtitles);
      
      // Find active subtitle
      const activeSubtitle = allSubtitles.find(
        (sub) => currentTime >= sub.start && currentTime <= sub.end
      );

      // Convert index to string for use as an ID
      setActiveSubtitleId(activeSubtitle ? activeSubtitle.index.toString() : null);
    }, [timelineRows, currentTime]);
    
    // Auto-scroll to keep playhead in view when it moves (vertical only)
    useEffect(() => {
      if (!timelineRows.length || currentTime <= 0 || !containerRef.current) return;
      
      // Find which row the current time falls into
      const currentRowIndex = timelineRows.findIndex(
        (row) => currentTime >= row.startTime && currentTime <= row.endTime
      );
      
      if (currentRowIndex === -1) return;
      
      const container = containerRef.current;
      const rowHeightWithGap = rowHeight + rowGap;
      const playheadTop = currentRowIndex * rowHeightWithGap;
      
      // Get the current scroll position and container dimensions
      const { scrollTop, clientHeight } = container;
      
      // Calculate the visible area boundaries
      const visibleTop = scrollTop;
      const visibleBottom = scrollTop + clientHeight;
      
      // Check if playhead is outside the visible area vertically
      if (playheadTop < visibleTop) {
        // Playhead is above the viewport
        container.scrollTop = playheadTop;
      } else if (playheadTop + rowHeight > visibleBottom) {
        // Playhead is below the viewport
        container.scrollTop = playheadTop + rowHeight - clientHeight;
      }
    }, [timelineRows, currentTime, rowHeight, rowGap]);

    // Handle click on timeline to set current time
    const handleTimelineClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        // Check if click target is a subtitle edit component
        const target = e.target as HTMLElement;
        const isEditingMode = target.tagName === 'TEXTAREA' || 
                         target.tagName === 'BUTTON' || 
                         target.closest('button') !== null ||
                         target.closest('.subtitle-editing') !== null;
        
        // Skip timeline navigation when clicking on editing controls
        if (isEditingMode) {
          return;
        }
        
        if (!audioBlob || !timelineRows.length) return;

        const container = containerRef.current;
        if (!container) return;

        // Get click coordinates relative to the container
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;

        // Find which row was clicked
        const rowHeightWithGap = rowHeight + rowGap;
        const clickedRowIndex = Math.floor(y / rowHeightWithGap);

        if (clickedRowIndex >= 0 && clickedRowIndex < timelineRows.length) {
          const row = timelineRows[clickedRowIndex];
          const pixelsPerMs = barWidth / msPerPoint;
          const clickTimeInRow = x / pixelsPerMs;
          const newTime = row.startTime + clickTimeInRow;

          // Callback to parent to set the new time
          onTimeClick(newTime);
        }
      },
      [audioBlob, timelineRows, barWidth, msPerPoint, rowHeight, rowGap, onTimeClick]
    );

    // Update visible rows based on scroll position
    useEffect(() => {
      if (timelineRows.length === 0 || !containerRef.current) return;

      const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, clientHeight } = container;
        const rowHeightWithGap = rowHeight + rowGap;

        // Calculate visible row range with buffer (2 rows above and below)
        const startRow = Math.max(0, Math.floor(scrollTop / rowHeightWithGap) - 2);
        const endRow = Math.min(
          timelineRows.length - 1,
          Math.ceil((scrollTop + clientHeight) / rowHeightWithGap) + 2
        );

        setVisibleRows([startRow, endRow]);
      };

      // Initialize visible rows
      handleScroll();

      // Add scroll listener
      const container = containerRef.current;
      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }, [timelineRows, rowHeight, rowGap]);

    // Expose method to edit active subtitle
    React.useImperativeHandle(ref, () => ({
      editActiveSubtitle: () => {
        return subtitleOverlayRef.current?.editActiveSubtitle() || false;
      }
    }));

    if (!waveform || timelineRows.length === 0) return null;

    return (
      <div
        ref={containerRef}
        onClick={handleTimelineClick}
        style={{
          width: "100%",
          height: "500px",
          position: "relative",
          overflow: "auto",
          border: "1px solid var(--gray-4)",
          borderRadius: "var(--radius-2)",
        }}
      >
        {/* Container for absolute positioning */}
        <div
          style={{
            height: `${totalHeight}px`,
            position: "relative",
            minWidth: "100%",
          }}
        >
          {/* Only render visible waveform rows */}
          {Array.from(
            {
              length: Math.min(
                visibleRows[1] - visibleRows[0] + 1,
                timelineRows.length
              ),
            },
            (_, i) => {
              const rowIndex = i + visibleRows[0];
              if (rowIndex >= timelineRows.length) return null;
              
              return (
                <TimelineRow
                  key={rowIndex}
                  rowIndex={rowIndex}
                  row={timelineRows[rowIndex]}
                  waveform={waveform}
                  barWidth={barWidth}
                  rowHeight={rowHeight}
                  rowGap={rowGap}
                  waveformHeight={waveformHeight}
                />
              );
            }
          )}

          {/* Render playhead cursor if audio is loaded */}
          {audioBlob && currentTime > 0 && (
            <TimelinePlayhead
              currentTime={currentTime}
              timelineRows={timelineRows}
              rowHeight={rowHeight}
              rowGap={rowGap}
              barWidth={barWidth}
              msPerPoint={msPerPoint}
            />
          )}

          {/* Render ALL subtitle cues to support Ctrl+F */}
          <SubtitleOverlay
            ref={subtitleOverlayRef}
            timelineRows={timelineRows}
            activeSubtitleId={activeSubtitleId}
            rowHeight={rowHeight}
            rowGap={rowGap}
          />

          {children}
        </div>
      </div>
    );
  }
  ));

export default TimelineContainer;