import { useStore } from "@nanostores/react";
import { Card, Flex } from "@radix-ui/themes";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { projectActions, projectStore } from "../../stores/projectStore";
import { createTimelineRows } from "../../utils/timeline/createTimelineRows";
import { SubtitleCue } from "../../utils/timeline/types";
import EditSubtitleModal from "./EditSubtitleModal";
import {
  AudioPlayer,
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
  const { currentProject, audioBlob, currentTime, isPlaying, playbackSpeed, editModal } =
    useStore(projectStore);
  const waveform = currentProject?.data?.waveform as number[] | undefined;
  const subtitles = currentProject?.data?.subtitles as
    | SubtitleCue[]
    | undefined;

  // Reference to the container element for focus management
  const containerRef = useRef<HTMLDivElement>(null);

  // Create audio URL from blob
  const audioUrl = useMemo(
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

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle audio time update
  const handleTimeUpdate = useCallback(() => {
    const audio = document.querySelector("audio");
    if (!audio || !subtitles) return;

    const currentTimeMs = audio.currentTime * 1000;
    projectActions.setCurrentTime(currentTimeMs);
  }, [subtitles]);

  // Toggle play/pause handler
  const handleTogglePlayPause = useCallback(() => {
    projectActions.togglePlayPause();
  }, []);

  // Handle timeline click
  const handleTimeClick = useCallback((newTime: number) => {
    projectActions.setCurrentTime(newTime);
  }, []);

  // Handle audio playback ending
  const handleAudioEnded = useCallback(() => {
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
          isPlaying={isPlaying}
          currentTime={currentTime}
          playbackSpeed={playbackSpeed}
          onTogglePlayPause={handleTogglePlayPause}
        />

        {/* Audio player component */}
        <AudioPlayer
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          playbackSpeed={playbackSpeed}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
        />

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
