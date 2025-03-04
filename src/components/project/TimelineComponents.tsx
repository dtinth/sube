import { Pencil1Icon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text } from "@radix-ui/themes";
import React, { useEffect, useMemo, useRef } from "react";
import { projectActions } from "../../stores/projectStore";
import { SubtitleCue } from "../../utils/timeline/types";

// Format time in seconds to MM:SS.ms format
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
};

// Get the top position of a row
export const getRowTopPosition = (
  rowIndex: number,
  rowHeight: number,
  rowGap: number
) => {
  return (rowHeight + rowGap) * rowIndex;
};

interface TimelineHeaderProps {
  projectId: string;
  waveform: number[] | undefined;
  subtitles: SubtitleCue[] | undefined;
  audioBlob: Blob | null;
  isVideo: boolean;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  onTogglePlayPause: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = React.memo(
  ({ projectId, waveform, subtitles, audioBlob, isVideo, isPlaying, currentTime, playbackSpeed, onTogglePlayPause }) => {
    return (
      <>
        <Text color="gray" size="2">
          Project ID: {projectId}
        </Text>
        <Flex justify="between" align="center">
          <Text size="4">Timeline</Text>
          {audioBlob && (
            <Flex gap="3" align="center">
              <Button
                variant="soft"
                onClick={onTogglePlayPause}
                color={isPlaying ? "amber" : "gray"}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Text size="2" color="gray">
                {formatTime(currentTime / 1000)} • {playbackSpeed}x
              </Text>
            </Flex>
          )}
        </Flex>
        {waveform && (
          <Text size="2" color="gray" mb="2">
            Waveform: {waveform.length} points ({(waveform.length / 10).toFixed(1)} seconds)
            {subtitles && ` • Subtitles: ${subtitles.length} cues`}
            {audioBlob && ` • ${isVideo ? 'Video' : 'Audio'}: ${Math.round(audioBlob.size / 1024)} KB`}
          </Text>
        )}
      </>
    );
  }
);

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  onTimeUpdate: () => void;
  onEnded: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = React.memo(
  ({ audioUrl, isPlaying, currentTime, playbackSpeed, onTimeUpdate, onEnded }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervalRef = useRef<number | null>(null);
    
    // Setup more frequent time updates during playback (every 100ms)
    useEffect(() => {
      // Clear any existing interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Only setup interval if playing
      if (isPlaying && audioRef.current) {
        // Setup interval for frequent updates
        intervalRef.current = window.setInterval(() => {
          if (audioRef.current) {
            onTimeUpdate();
          }
        }, 100);
      }
      
      // Cleanup on unmount or when isPlaying changes
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [isPlaying, onTimeUpdate]);

    // Handle audio playback control
    useEffect(() => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
          // We can't call projectActions directly here, so we'll handle this in the parent
          onEnded();
        });
      } else {
        audioRef.current.pause();
      }
    }, [isPlaying, onEnded]);

    // Update audio current time when changed from store
    useEffect(() => {
      if (!audioRef.current) return;
      if (Math.abs(audioRef.current.currentTime * 1000 - currentTime) > 100) {
        audioRef.current.currentTime = currentTime / 1000;
      }
    }, [currentTime]);

    // Update playback rate when changed from store
    useEffect(() => {
      if (!audioRef.current) return;
      audioRef.current.playbackRate = playbackSpeed;
    }, [playbackSpeed]);

    if (!audioUrl) return null;

    return (
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={onTimeUpdate} // Keep the native event as backup
        onEnded={onEnded}
        style={{ display: "none" }}
      />
    );
  }
);

interface VideoPlayerProps {
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  onTimeUpdate: () => void;
  onEnded: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(
  ({ videoUrl, isPlaying, currentTime, playbackSpeed, onTimeUpdate, onEnded }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const intervalRef = useRef<number | null>(null);
    
    // Setup more frequent time updates during playback (every 100ms)
    useEffect(() => {
      // Clear any existing interval
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Only setup interval if playing
      if (isPlaying && videoRef.current) {
        // Setup interval for frequent updates
        intervalRef.current = window.setInterval(() => {
          if (videoRef.current) {
            onTimeUpdate();
          }
        }, 100);
      }
      
      // Cleanup on unmount or when isPlaying changes
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [isPlaying, onTimeUpdate]);

    // Handle video playback control
    useEffect(() => {
      if (!videoRef.current) return;

      if (isPlaying) {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
          onEnded();
        });
      } else {
        videoRef.current.pause();
      }
    }, [isPlaying, onEnded]);

    // Update video current time when changed from store
    useEffect(() => {
      if (!videoRef.current) return;
      if (Math.abs(videoRef.current.currentTime * 1000 - currentTime) > 100) {
        videoRef.current.currentTime = currentTime / 1000;
      }
    }, [currentTime]);

    // Update playback rate when changed from store
    useEffect(() => {
      if (!videoRef.current) return;
      videoRef.current.playbackRate = playbackSpeed;
    }, [playbackSpeed]);

    if (!videoUrl) return null;

    return (
      <div style={{ 
        borderRadius: 'var(--radius-3)', 
        overflow: 'hidden', 
        marginBottom: '12px',
        maxHeight: '250px',
      }}>
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          style={{ 
            width: '100%',
            maxHeight: '250px',
            objectFit: 'contain',
            backgroundColor: 'black',
          }}
          controls={false}
        />
      </div>
    );
  }
);

interface TimelineRowProps {
  rowIndex: number;
  row: {
    startPoint: number;
    pointCount: number;
    width: number;
    startTime: number;
    subtitles: any[];
  };
  waveform: number[];
  barWidth: number;
  rowHeight: number;
  rowGap: number;
  waveformHeight: number;
}

export const TimelineRow: React.FC<TimelineRowProps> = React.memo(
  ({ rowIndex, row, waveform, barWidth, rowHeight, rowGap, waveformHeight }) => {
    const rowPoints = waveform.slice(row.startPoint, row.startPoint + row.pointCount);
    const rowTop = getRowTopPosition(rowIndex, rowHeight, rowGap);

    return (
      <div
        key={rowIndex}
        style={{
          position: "absolute",
          top: rowTop,
          left: 0,
          width: `${row.width}px`,
          height: `${rowHeight}px`,
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
            height: `${waveformHeight}px`,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {rowPoints.map((value, i) => (
            <div
              key={i}
              style={{
                width: `${barWidth - 1}px`,
                height: `${Math.max(1, value * waveformHeight)}px`,
                backgroundColor: "var(--accent-9)",
                marginRight: "1px",
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

interface EditableSubtitleProps {
  subtitle: {
    index: number;
    text: string;
    startOffsetInRow: number;
    width: number;
    start: number;
    end: number;
  };
  isActive: boolean;
  rowTop: number;
  rowHeight: number;
}

interface EditableSubtitleRef {
  startEditing: () => void;
}

export const EditableSubtitle = React.memo(
  React.forwardRef<EditableSubtitleRef, EditableSubtitleProps>(
    ({ subtitle, isActive, rowTop, rowHeight }, ref) => {
      // Destructure subtitle properties to prevent re-renders when parent objects change
      const { index, text, startOffsetInRow, width, start } = subtitle;
      
      // Expose startEditing method to parents via ref
      React.useImperativeHandle(ref, () => ({
        startEditing: () => {
          projectActions.openSubtitleEditModal(index, text, formatTime(start / 1000));
          return true;
        }
      }));

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent click from propagating to timeline
      projectActions.openSubtitleEditModal(index, text, formatTime(start / 1000));
    };

    // Memoize the JSX element to optimize rendering
    const subtitleElement = useMemo(() => {
      return (
        <div
          key={`subtitle-${index}`}
          style={{
            position: "absolute",
            left: `${startOffsetInRow}px`,
            top: `${rowTop + 10}px`,
            width: `${width}px`,
            maxHeight: `${rowHeight - 20}px`,
            padding: "4px",
            backgroundColor: isActive
              ? "rgba(255, 182, 0, 0.5)"
              : "rgba(121, 134, 203, 0.25)",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            overflow: "auto",
            border: isActive
              ? "1px solid var(--amber-9)"
              : "1px solid var(--accent-6)",
            boxSizing: "border-box",
            zIndex: 2,
            pointerEvents: "auto", // Enable interactions
            transition: "background-color 0.2s, border 0.2s",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Flex direction="column" style={{ position: "relative", width: "100%" }}>
            <div>{text}</div>
            <Button
              size="1"
              variant="ghost"
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                padding: "2px",
                opacity: 0.6,
              }}
              onClick={handleEdit}
            >
              <Pencil1Icon />
            </Button>
          </Flex>
        </div>
      );
    }, [index, text, startOffsetInRow, width, rowTop, rowHeight, isActive, handleEdit]);

    return subtitleElement;
  }
  ));

// Moved to SubtitleOverlay.tsx

interface TimelinePlayheadProps {
  currentTime: number;
  timelineRows: Array<{
    startTime: number;
    endTime: number;
  }>;
  rowHeight: number;
  rowGap: number;
  barWidth: number;
  msPerPoint: number;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = React.memo(
  ({ currentTime, timelineRows, rowHeight, rowGap, barWidth, msPerPoint }) => {
    const playheadPosition = useMemo(() => {
      if (!timelineRows.length || currentTime <= 0) return null;

      // Find which row the current time falls into
      const rowIndex = timelineRows.findIndex(
        (row) => currentTime >= row.startTime && currentTime <= row.endTime
      );

      if (rowIndex === -1) return null;

      const row = timelineRows[rowIndex];
      const timeInRow = currentTime - row.startTime;
      const pixelsPerMs = barWidth / msPerPoint;

      return { row, rowIndex, x: timeInRow * pixelsPerMs };
    }, [currentTime, timelineRows, barWidth, msPerPoint]);

    if (!playheadPosition) return null;

    const rowTop = getRowTopPosition(playheadPosition.rowIndex, rowHeight, rowGap);

    return (
      <div
        style={{
          position: "absolute",
          top: rowTop,
          height: rowHeight,
          width: "2px",
          backgroundColor: "var(--amber-9)",
          zIndex: 3,
          left: `${playheadPosition.x}px`,
          pointerEvents: "none",
        }}
      />
    );
  }
);

interface EmptyTimelineProps {}

export const EmptyTimeline: React.FC<EmptyTimelineProps> = React.memo(() => {
  return (
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
        Use the "Import Waveform" and "Import Subtitles" options from the menu.
      </Text>
    </Flex>
  );
});

// Keyboard shortcut component
export const KeyboardShortcuts: React.FC = React.memo(() => {
  const kbdStyle = {
    background: "var(--gray-3)", 
    padding: "2px 6px", 
    borderRadius: "4px", 
    border: "1px solid var(--gray-5)",
    margin: "0 2px" 
  };

  return (
    <Flex justify="center" mb="2">
      <Text size="2" color="gray">
        Shortcuts: <kbd style={kbdStyle}>Space</kbd> play/pause
        <kbd style={kbdStyle}>E</kbd> edit subtitle
        <kbd style={kbdStyle}>←/→</kbd> seek 3s
        <kbd style={kbdStyle}>[/]</kbd> adjust start time
        <kbd style={kbdStyle}>{"{"}</kbd>/<kbd style={kbdStyle}>{"}"}</kbd> adjust end time
        <kbd style={kbdStyle}>,</kbd> move end to playhead
        <kbd style={kbdStyle}>.</kbd> move start to playhead
        <kbd style={kbdStyle}>-</kbd>/<kbd style={kbdStyle}>+</kbd> speed
      </Text>
    </Flex>
  );
});