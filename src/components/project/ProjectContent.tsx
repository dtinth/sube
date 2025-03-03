import { Card, Flex, Text } from "@radix-ui/themes";
import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { projectStore } from "../../stores/projectStore";

interface ProjectContentProps {
  projectId: string;
}

// Constants for waveform visualization
const BAR_WIDTH = 8; // pixels
const POINTS_PER_ROW = 150; // 15 seconds (100ms per point)
const ROW_WIDTH = BAR_WIDTH * POINTS_PER_ROW; // 1200px
const ROW_HEIGHT = 60; // pixels
const ROW_GAP = 10; // pixels
const VISIBLE_BUFFER = 2; // extra rows to render above and below viewport

/**
 * Displays the main content area of the project
 * Shows waveform data as a timeline visualization if available
 */
const ProjectContent: React.FC<ProjectContentProps> = ({ projectId }) => {
  const { currentProject } = useStore(projectStore);
  const waveform = currentProject?.data?.waveform as number[] | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRows, setVisibleRows] = useState<[number, number]>([0, 10]);

  // Calculate total number of rows
  const totalRows = waveform ? Math.ceil(waveform.length / POINTS_PER_ROW) : 0;
  const totalHeight = totalRows * (ROW_HEIGHT + ROW_GAP);

  // Update visible rows based on scroll position
  useEffect(() => {
    if (!waveform || !containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const { scrollTop, clientHeight } = container;
      const rowHeight = ROW_HEIGHT + ROW_GAP;
      
      // Calculate visible row range with buffer
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - VISIBLE_BUFFER);
      const endRow = Math.min(
        totalRows - 1,
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
  }, [waveform, totalRows]);

  // Render a single row of the waveform
  const renderRow = (rowIndex: number) => {
    if (!waveform) return null;
    
    const startPoint = rowIndex * POINTS_PER_ROW;
    const endPoint = Math.min(startPoint + POINTS_PER_ROW, waveform.length);
    
    // Skip if row is out of bounds
    if (startPoint >= waveform.length) return null;
    
    const rowPoints = waveform.slice(startPoint, endPoint);
    
    return (
      <div 
        key={rowIndex}
        style={{
          position: 'absolute',
          top: rowIndex * (ROW_HEIGHT + ROW_GAP),
          left: 0,
          width: `${ROW_WIDTH}px`,
          height: `${ROW_HEIGHT}px`,
          display: 'flex',
          alignItems: 'flex-end'
        }}
      >
        {/* Time label for each row */}
        <div style={{ 
          position: 'absolute', 
          top: -15, 
          left: 0, 
          fontSize: '10px', 
          color: 'var(--gray-10)'
        }}>
          {formatTime(startPoint / 10)}
        </div>
        
        {/* Render bars for each data point in this row */}
        {rowPoints.map((value, i) => (
          <div
            key={i}
            style={{
              width: `${BAR_WIDTH - 1}px`,
              height: `${Math.max(1, value * ROW_HEIGHT)}px`,
              backgroundColor: 'var(--accent-9)',
              marginRight: '1px'
            }}
          />
        ))}
      </div>
    );
  };

  // Format time in seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card size="3" style={{ minHeight: "400px" }}>
      <Flex direction="column" gap="2" width="100%">
        <Text color="gray" size="2">
          Project ID: {projectId}
        </Text>
        
        {waveform ? (
          <>
            <Text size="4">Waveform Timeline</Text>
            <Text size="2" color="gray" mb="2">
              {waveform.length} data points ({(waveform.length / 10).toFixed(1)} seconds)
            </Text>
            
            {/* Waveform container with virtualized rows */}
            <div 
              ref={containerRef}
              style={{
                width: '100%',
                height: '400px',
                position: 'relative',
                overflow: 'auto',
                border: '1px solid var(--gray-4)',
                borderRadius: 'var(--radius-2)'
              }}
            >
              {/* Container for absolute positioning */}
              <div style={{ 
                height: `${totalHeight}px`, 
                width: `${ROW_WIDTH}px`, 
                position: 'relative' 
              }}>
                {/* Only render visible rows */}
                {Array.from(
                  { length: visibleRows[1] - visibleRows[0] + 1 },
                  (_, i) => renderRow(i + visibleRows[0])
                )}
              </div>
            </div>
          </>
        ) : (
          <Flex direction="column" align="center" justify="center" gap="4" height="300px">
            <Text size="4" color="gray">
              No waveform data available.
            </Text>
            <Text color="gray">
              Use the "Import Waveform" option from the menu to load data.
            </Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

export default ProjectContent;