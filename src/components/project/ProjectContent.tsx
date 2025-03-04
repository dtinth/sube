import { useStore } from "@nanostores/react";
import { Card, Flex } from "@radix-ui/themes";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { projectActions, projectStore } from "../../stores/projectStore";
import { createTimelineRows } from "../../utils/timeline/createTimelineRows";
import EditSubtitleModal from "./EditSubtitleModal";
import {
  AudioPlayer,
  VideoPlayer,
  EmptyTimeline,
  KeyboardShortcuts,
  TimelineHeader,
} from "./TimelineComponents";
import TimelineContainer from "./TimelineContainer";

interface ProjectContentProps {
  projectId: string;
}

// Constants for waveform visualization
const BAR_WIDTH = 8; // pixels
const POINTS_PER_ROW = 150; // 15 seconds (100ms per point)
const ROW_HEIGHT = 96; // pixels (increased to accommodate subtitles)
const WAVEFORM_HEIGHT = 64; // pixels
const ROW_GAP = 20; // pixels
const MS_PER_POINT = 100; // each point represents 100ms

/**
 * Displays the main content area of the project
 * Shows waveform and subtitles data as a timeline visualization
 */
const ProjectContent: React.FC<ProjectContentProps> = ({ projectId }) => {
  const { currentProject, audioBlob, isVideo, currentTime, isPlaying, playbackSpeed, editModal } =
    useStore(projectStore);
  const waveform = currentProject?.data?.waveform;
  const subtitles = currentProject?.data?.subtitles;

  // Reference to the container element for focus management
  const containerRef = useRef<HTMLDivElement>(null);

  // Create media URL from blob
  const mediaUrl = useMemo(
    () => (audioBlob ? URL.createObjectURL(audioBlob) : null),
    [audioBlob]
  );

  // Generate timeline rows using the pure function
  const timelineRows = useMemo(() => {
    return createTimelineRows(waveform, subtitles, {
      barWidth: BAR_WIDTH,
      pointsPerRow: POINTS_PER_ROW,
      msPerPoint: MS_PER_POINT,
    });
  }, [waveform, subtitles]);

  // Clean up media URL when component unmounts
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  // Handle media time update
  const handleTimeUpdate = useCallback(() => {
    const media = isVideo 
      ? document.querySelector("video") 
      : document.querySelector("audio");
    
    if (!media || !subtitles) return;

    const currentTimeMs = media.currentTime * 1000;
    projectActions.setCurrentTime(currentTimeMs);
  }, [subtitles, isVideo]);

  // Toggle play/pause handler
  const handleTogglePlayPause = useCallback(() => {
    projectActions.togglePlayPause();
  }, []);

  // Handle timeline click
  const handleTimeClick = useCallback((newTime: number) => {
    projectActions.setCurrentTime(newTime);
  }, []);

  // Handle media playback ending
  const handleMediaEnded = useCallback(() => {
    projectActions.pause();
  }, []);

  // Reference to the timeline container component for keyboard navigation
  const timelineContainerRef = useRef<any>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore events when typing in input elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Spacebar = play/pause
      if (e.code === "Space" && audioBlob) {
        e.preventDefault(); // Prevent page scroll
        projectActions.togglePlayPause();
        return;
      }
      
      // Playback speed controls
      if (audioBlob) {
        // Minus key = decrease playback speed
        if (e.code === "Minus") {
          e.preventDefault();
          projectActions.decreasePlaybackSpeed();
          return;
        }
        
        // Plus or Equals key = increase playback speed
        if (e.code === "Equal") {  // "Equal" is the code for both "=" and "+"
          e.preventDefault();
          projectActions.increasePlaybackSpeed();
          return;
        }
      }

      // E key = edit active subtitle
      if (
        (e.code === "KeyE" || e.code === "Enter") &&
        timelineContainerRef.current?.editActiveSubtitle
      ) {
        e.preventDefault();
        timelineContainerRef.current.editActiveSubtitle();
        return;
      }

      // Left/Right arrow keys = navigate timeline by 3 seconds
      if (audioBlob) {
        const SEEK_SECONDS = 3;
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          const newTime = Math.max(0, currentTime - SEEK_SECONDS * 1000);
          projectActions.setCurrentTime(newTime);
          return;
        }

        if (e.code === "ArrowRight") {
          e.preventDefault();
          projectActions.setCurrentTime(currentTime + SEEK_SECONDS * 1000);
          return;
        }
      }

      // Subtitle timing adjustment shortcuts
      if (subtitles) {
        // Get the active subtitle index - either from the edit modal if open or from the active subtitle
        let activeSubtitleIndex = -1;

        if (projectStore.get().editModal.isOpen) {
          activeSubtitleIndex = projectStore.get().editModal.subtitleIndex;
        } else {
          // Find all subtitles across all rows
          const allSubtitles = timelineRows.flatMap((row) => row.subtitles);

          // Find active subtitle
          const activeSubtitle = allSubtitles.find(
            (sub) => currentTime >= sub.start && currentTime <= sub.end
          );

          if (activeSubtitle) {
            activeSubtitleIndex = activeSubtitle.index;
          }
        }

        if (activeSubtitleIndex >= 0) {
          const ADJUST_TIME = 100; // 100ms adjustment

          // [ and ] adjust start time
          if (e.code === "BracketLeft" && !e.shiftKey) {
            // [
            e.preventDefault();
            projectActions.adjustSubtitleTiming(
              activeSubtitleIndex,
              "startTime",
              -ADJUST_TIME
            );
            return;
          }

          if (e.code === "BracketRight" && !e.shiftKey) {
            // ]
            e.preventDefault();
            projectActions.adjustSubtitleTiming(
              activeSubtitleIndex,
              "startTime",
              ADJUST_TIME
            );
            return;
          }

          // Shift+[ and Shift+] ({ and }) adjust end time
          if (e.code === "BracketLeft" && e.shiftKey) {
            // {
            e.preventDefault();
            projectActions.adjustSubtitleTiming(
              activeSubtitleIndex,
              "endTime",
              -ADJUST_TIME
            );
            return;
          }

          if (e.code === "BracketRight" && e.shiftKey) {
            // }
            e.preventDefault();
            projectActions.adjustSubtitleTiming(
              activeSubtitleIndex,
              "endTime",
              ADJUST_TIME
            );
            return;
          }
        }
        
        // Comma key (,) - Move endpoint to playhead or start of next segment to playhead
        if (e.code === "Comma") {
          e.preventDefault();
          
          // Round the current time to the nearest 100ms
          const roundedCurrentTime = Math.round(currentTime / 100) * 100;
          
          // Find all subtitles across all rows
          const allSubtitles = timelineRows.flatMap((row) => row.subtitles);
          
          // Sort subtitles by start time for consistent processing
          const sortedSubtitles = [...allSubtitles].sort((a, b) => a.start - b.start);
          
          // Find the active subtitle that contains the current time
          const activeSubtitle = sortedSubtitles.find(
            (sub) => currentTime >= sub.start && currentTime <= sub.end
          );
          
          if (activeSubtitle) {
            // If playhead is inside a segment and end time isn't already at playhead
            if (Math.abs(activeSubtitle.end - roundedCurrentTime) > 10) {
              // Move the endpoint to the playhead
              projectActions.adjustSubtitleTiming(
                activeSubtitle.index,
                "endTime",
                roundedCurrentTime - activeSubtitle.end
              );
            } else {
              // Find the next subtitle after current active one
              const nextSubtitleIndex = sortedSubtitles.findIndex(s => s.index === activeSubtitle.index) + 1;
              if (nextSubtitleIndex < sortedSubtitles.length) {
                const nextSubtitle = sortedSubtitles[nextSubtitleIndex];
                // Move the next subtitle's start to the playhead
                projectActions.adjustSubtitleTiming(
                  nextSubtitle.index,
                  "startTime",
                  roundedCurrentTime - nextSubtitle.start
                );
              }
            }
          } else {
            // No active subtitle - find the next subtitle after current time
            const nextSubtitle = sortedSubtitles.find(sub => sub.start > currentTime);
            if (nextSubtitle) {
              // Move the next subtitle's start to the playhead
              projectActions.adjustSubtitleTiming(
                nextSubtitle.index,
                "startTime",
                roundedCurrentTime - nextSubtitle.start
              );
            }
          }
          return;
        }
        
        // Period key (.) - Move start point to playhead or end of previous segment to playhead
        if (e.code === "Period") {
          e.preventDefault();
          
          // Round the current time to the nearest 100ms
          const roundedCurrentTime = Math.round(currentTime / 100) * 100;
          
          // Find all subtitles across all rows
          const allSubtitles = timelineRows.flatMap((row) => row.subtitles);
          
          // Sort subtitles by start time for consistent processing
          const sortedSubtitles = [...allSubtitles].sort((a, b) => a.start - b.start);
          
          // Find the active subtitle that contains the current time
          const activeSubtitle = sortedSubtitles.find(
            (sub) => currentTime >= sub.start && currentTime <= sub.end
          );
          
          if (activeSubtitle) {
            // If playhead is inside a segment and start time isn't already at playhead
            if (Math.abs(activeSubtitle.start - roundedCurrentTime) > 10) {
              // Move the startpoint to the playhead
              projectActions.adjustSubtitleTiming(
                activeSubtitle.index,
                "startTime",
                roundedCurrentTime - activeSubtitle.start
              );
            } else {
              // Find the previous subtitle before current active one
              const prevSubtitleIndex = sortedSubtitles.findIndex(s => s.index === activeSubtitle.index) - 1;
              if (prevSubtitleIndex >= 0) {
                const prevSubtitle = sortedSubtitles[prevSubtitleIndex];
                // Move the previous subtitle's end to the playhead
                projectActions.adjustSubtitleTiming(
                  prevSubtitle.index,
                  "endTime",
                  roundedCurrentTime - prevSubtitle.end
                );
              }
            }
          } else {
            // No active subtitle - find the previous subtitle before current time
            const prevSubtitle = [...sortedSubtitles]
              .reverse()
              .find(sub => sub.end < currentTime);
            if (prevSubtitle) {
              // Move the previous subtitle's end to the playhead
              projectActions.adjustSubtitleTiming(
                prevSubtitle.index,
                "endTime",
                roundedCurrentTime - prevSubtitle.end
              );
            }
          }
          return;
        }
      }
    },
    [audioBlob, currentTime, subtitles, timelineRows, playbackSpeed]
  );

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Focus the container for better keyboard interaction
    if (containerRef.current) {
      containerRef.current.focus();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Card size="3" style={{ minHeight: "400px" }}>
      <Flex
        direction="column"
        gap="2"
        width="100%"
        ref={containerRef}
        tabIndex={0} // Make div focusable
        style={{ outline: "none" }} // Remove outline when focused
      >
        {/* Timeline header with controls */}
        <TimelineHeader
          projectId={projectId}
          waveform={waveform}
          subtitles={subtitles}
          audioBlob={audioBlob}
          isVideo={isVideo}
          isPlaying={isPlaying}
          currentTime={currentTime}
          playbackSpeed={playbackSpeed}
          onTogglePlayPause={handleTogglePlayPause}
        />

        {/* Media player component */}
        {isVideo ? (
          <VideoPlayer
            videoUrl={mediaUrl}
            isPlaying={isPlaying}
            currentTime={currentTime}
            playbackSpeed={playbackSpeed}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleMediaEnded}
          />
        ) : (
          <AudioPlayer
            audioUrl={mediaUrl}
            isPlaying={isPlaying}
            currentTime={currentTime}
            playbackSpeed={playbackSpeed}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleMediaEnded}
          />
        )}

        {waveform ? (
          /* Timeline container with all timeline components */
          <TimelineContainer
            ref={timelineContainerRef}
            timelineRows={timelineRows}
            waveform={waveform}
            audioBlob={audioBlob}
            currentTime={currentTime}
            onTimeClick={handleTimeClick}
            barWidth={BAR_WIDTH}
            rowHeight={ROW_HEIGHT}
            rowGap={ROW_GAP}
            waveformHeight={WAVEFORM_HEIGHT}
            msPerPoint={MS_PER_POINT}
          />
        ) : (
          /* Empty state when no timeline data is available */
          <EmptyTimeline />
        )}

        {/* Keyboard shortcuts guide */}
        {audioBlob && <KeyboardShortcuts />}

        {/* Edit Subtitle Modal */}
        <EditSubtitleModal
          isOpen={editModal.isOpen}
          onClose={projectActions.closeSubtitleEditModal}
          subtitleIndex={editModal.subtitleIndex}
          subtitleText={editModal.subtitleText}
          subtitleTime={editModal.subtitleTime}
        />
      </Flex>
    </Card>
  );
};

export default ProjectContent;
