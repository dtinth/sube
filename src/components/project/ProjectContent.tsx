import { useStore } from "@nanostores/react";
import { Card, Flex, Text } from "@radix-ui/themes";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { projectStore } from "../../stores/projectStore";
import { createTimelineRows } from "../../utils/timeline/createTimelineRows";
import { SubtitleCue } from "../../utils/timeline/types";

interface ProjectContentProps {
  projectId: string;
}

// Constants for waveform visualization
const BAR_WIDTH = 8; // pixels
const POINTS_PER_ROW = 150; // 15 seconds (100ms per point)
const ROW_HEIGHT = 96; // pixels (increased to accommodate subtitles)
const WAVEFORM_HEIGHT = 64; // pixels
const ROW_GAP = 20; // pixels
const VISIBLE_BUFFER = 2; // extra rows to render above and below viewport
const MS_PER_POINT = 100; // each point represents 100ms

/**
 * Displays the main content area of the project
 * Shows waveform and subtitles data as a timeline visualization
 */
const ProjectContent: React.FC<ProjectContentProps> = ({ projectId }) => {
  const { currentProject } = useStore(projectStore);
  const waveform = currentProject?.data?.waveform as number[] | undefined;
  const subtitles = currentProject?.data?.subtitles as
    | SubtitleCue[]
    | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState<[number, number]>([0, 10]);

  // Generate timeline rows using the pure function
  const timelineRows = useMemo(() => {
    return createTimelineRows(waveform, subtitles, {
      barWidth: BAR_WIDTH,
      pointsPerRow: POINTS_PER_ROW,
      msPerPoint: MS_PER_POINT,
    });
  }, [waveform, subtitles]);

  // Calculate total height of the timeline
  const totalHeight = timelineRows.reduce(
    (sum, _) => sum + ROW_HEIGHT + ROW_GAP,
    0
  );

  // Update visible rows based on scroll position
  useEffect(() => {
    if (timelineRows.length === 0 || !containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, clientHeight } = container;
      const rowHeight = ROW_HEIGHT + ROW_GAP;

      // Calculate visible row range with buffer
      const startRow = Math.max(
        0,
        Math.floor(scrollTop / rowHeight) - VISIBLE_BUFFER
      );
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
    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [timelineRows]);

  // Render a single row of the timeline
  const renderRow = (rowIndex: number) => {
    if (
      !waveform ||
      timelineRows.length === 0 ||
      rowIndex >= timelineRows.length
    )
      return null;

    const row = timelineRows[rowIndex];
    const rowPoints = waveform.slice(
      row.startPoint,
      row.startPoint + row.pointCount
    );

    // Calculate the top position of this row
    const rowTop = timelineRows
      .slice(0, rowIndex)
      .reduce((sum, _) => sum + ROW_HEIGHT + ROW_GAP, 0);

    return (
      <div
        key={rowIndex}
        style={{
          position: "absolute",
          top: rowTop,
          left: 0,
          width: `${row.width}px`,
          height: `${ROW_HEIGHT}px`,
          borderBottom: "1px solid var(--gray-3)",
        }}
      >
        {/* Time label for each row */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            fontSize: "10px",
            color: "var(--gray-10)",
            padding: "2px 4px",
            backgroundColor: "var(--gray-2)",
            borderRadius: "2px",
            zIndex: 1,
          }}
        >
          {formatTime(row.startTime / 1000)}
        </div>

        {/* Render waveform */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: `${WAVEFORM_HEIGHT}px`,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {rowPoints.map((value, i) => (
            <div
              key={i}
              style={{
                width: `${BAR_WIDTH - 1}px`,
                height: `${Math.max(1, value * WAVEFORM_HEIGHT)}px`,
                backgroundColor: "var(--accent-9)",
                marginRight: "1px",
              }}
            />
          ))}
        </div>

        {/* Render subtitles - allow them to overlay the waveform */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${ROW_HEIGHT}px`,
          }}
        >
          {row.subtitles.map((subtitle, index) => (
            <div
              key={`${subtitle.id}-${index}`}
              style={{
                position: "absolute",
                left: `${subtitle.startOffsetInRow}px`,
                top: "10px",
                width: `${subtitle.width}px`,
                maxHeight: `${ROW_HEIGHT - 20}px`,
                padding: "4px",
                backgroundColor: "rgba(121, 134, 203, 0.25)",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "pre-wrap",
                overflow: "auto",
                border: "1px solid var(--accent-6)",
                boxSizing: "border-box",
                zIndex: 2,
              }}
            >
              {subtitle.text}
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
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(3, "0")}`;
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
              Waveform: {waveform.length} points (
              {(waveform.length / 10).toFixed(1)} seconds)
              {subtitles && ` • Subtitles: ${subtitles.length} cues`}
            </Text>

            {/* Timeline container with virtualized rows */}
            <div
              ref={containerRef}
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
                {/* Only render visible rows */}
                {timelineRows.length > 0 &&
                  Array.from(
                    {
                      length: Math.min(
                        visibleRows[1] - visibleRows[0] + 1,
                        timelineRows.length
                      ),
                    },
                    (_, i) => renderRow(i + visibleRows[0])
                  )}
              </div>
            </div>
          </>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="4"
            height="300px"
          >
            <Text size="4" color="gray">
              No timeline data available.
            </Text>
            <Text color="gray">
              Use the "Import Waveform" and "Import Subtitles" options from the
              menu.
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default ProjectContent;
