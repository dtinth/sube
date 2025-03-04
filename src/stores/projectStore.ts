import { get, set } from "idb-keyval";
import { map } from "nanostores";
import { v4 as uuidv4 } from "uuid";
import { Project } from "../types";
import {
  exportProjectToJSON,
  getProject,
  importProjectFromJSON,
  updateProject,
} from "../utils/storage";
import { SubtitleCue } from "../utils/timeline/types";

// Store shape
interface ProjectStoreState {
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  audioBlob: Blob | null;
  currentTime: number; // Current playback time in ms
  isPlaying: boolean;
  playbackSpeed: number; // Playback speed rate (0.75, 1, 1.25, 1.5, 1.75, 2)
  editModal: {
    isOpen: boolean;
    subtitleIndex: number;
    subtitleText: string;
    subtitleTime: string;
  };
}

// Initialize the store with default values
export const projectStore = map<ProjectStoreState>({
  currentProject: null,
  isLoading: false,
  error: null,
  audioBlob: null,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  editModal: {
    isOpen: false,
    subtitleIndex: -1,
    subtitleText: "",
    subtitleTime: "",
  },
});

// Actions
export const projectActions = {
  loadProject: async (id: string) => {
    projectStore.setKey("isLoading", true);
    projectStore.setKey("error", null);
    projectStore.setKey("audioBlob", null);
    projectStore.setKey("currentTime", 0);
    projectStore.setKey("isPlaying", false);
    projectStore.setKey("playbackSpeed", 1);

    try {
      const projectData = await getProject(id);
      if (projectData) {
        projectStore.setKey("currentProject", projectData);

        // Check if the project has an audio blob stored
        if (projectData.data?.audioBlobId) {
          try {
            const audioBlobKey = `audio/${projectData.data.audioBlobId}`;
            const audioBlob = await get(audioBlobKey);
            if (audioBlob instanceof Blob) {
              projectStore.setKey("audioBlob", audioBlob);
            }
          } catch (audioError) {
            console.error("Failed to load audio blob:", audioError);
          }
        }
      } else {
        projectStore.setKey("error", "Project not found");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      projectStore.setKey("error", "Failed to load project");
    } finally {
      projectStore.setKey("isLoading", false);
    }
  },

  renameProject: async (title: string) => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject || !title.trim()) return;

    try {
      const updatedProject = await updateProject({
        ...currentProject,
        title,
      });
      projectStore.setKey("currentProject", updatedProject);
      return true;
    } catch (error) {
      console.error("Failed to rename project:", error);
      return false;
    }
  },

  exportProject: () => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject) return null;

    const jsonData = exportProjectToJSON(currentProject);
    return {
      jsonData,
      filename: `${currentProject.title.replace(/\s+/g, "_")}_${
        currentProject.id
      }.json`,
    };
  },

  importProjectData: async (jsonData: string) => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject) return false;

    try {
      const updatedProject = await importProjectFromJSON(
        currentProject.id,
        jsonData
      );
      projectStore.setKey("currentProject", updatedProject);
      return true;
    } catch (error) {
      console.error("Failed to import project data:", error);
      return false;
    }
  },

  importWaveform: async (waveform: number[]) => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject) return false;

    try {
      const updatedProject = await updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          waveform,
        },
        updatedAt: Date.now(),
      });
      projectStore.setKey("currentProject", updatedProject);
      return true;
    } catch (error) {
      console.error("Failed to import waveform:", error);
      return false;
    }
  },

  importSubtitles: async (subtitles: SubtitleCue[]) => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject) return false;

    try {
      const updatedProject = await updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          subtitles,
        },
        updatedAt: Date.now(),
      });
      projectStore.setKey("currentProject", updatedProject);
      return true;
    } catch (error) {
      console.error("Failed to import subtitles:", error);
      return false;
    }
  },

  importAudio: async (audioBlob: Blob) => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject) return false;

    try {
      // Generate a unique ID for the audio blob
      const audioBlobId = uuidv4();
      const audioBlobKey = `audio/${audioBlobId}`;

      // Store the audio blob in IndexedDB
      await set(audioBlobKey, audioBlob);

      // Update the project with the audio blob ID reference
      const updatedProject = await updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          audioBlobId,
        },
        updatedAt: Date.now(),
      });

      projectStore.setKey("currentProject", updatedProject);
      projectStore.setKey("audioBlob", audioBlob);
      return true;
    } catch (error) {
      console.error("Failed to import audio:", error);
      return false;
    }
  },

  // Playback controls
  setCurrentTime: (time: number) => {
    projectStore.setKey("currentTime", time);
  },

  play: () => {
    projectStore.setKey("isPlaying", true);
  },

  pause: () => {
    projectStore.setKey("isPlaying", false);
  },

  togglePlayPause: () => {
    const isPlaying = projectStore.get().isPlaying;
    projectStore.setKey("isPlaying", !isPlaying);
  },

  // Playback speed controls
  setPlaybackSpeed: (speed: number) => {
    // Ensure speed is one of the allowed values
    const validSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
    if (validSpeeds.includes(speed)) {
      projectStore.setKey("playbackSpeed", speed);
    }
  },

  increasePlaybackSpeed: () => {
    const currentSpeed = projectStore.get().playbackSpeed;
    const validSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = validSpeeds.indexOf(currentSpeed);
    
    if (currentIndex < validSpeeds.length - 1) {
      projectStore.setKey("playbackSpeed", validSpeeds[currentIndex + 1]);
    }
  },

  decreasePlaybackSpeed: () => {
    const currentSpeed = projectStore.get().playbackSpeed;
    const validSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = validSpeeds.indexOf(currentSpeed);
    
    if (currentIndex > 0) {
      projectStore.setKey("playbackSpeed", validSpeeds[currentIndex - 1]);
    }
  },

  // Modal actions
  openSubtitleEditModal: (
    subtitleIndex: number,
    subtitleText: string,
    subtitleTime: string
  ) => {
    projectStore.setKey("editModal", {
      isOpen: true,
      subtitleIndex,
      subtitleText,
      subtitleTime,
    });
  },

  closeSubtitleEditModal: () => {
    projectStore.setKey("editModal", {
      ...projectStore.get().editModal,
      isOpen: false,
    });
  },

  updateSubtitleText: async (subtitleIndex: number, newText: string) => {
    const { currentProject } = projectStore.get();
    if (!currentProject || !currentProject.data?.subtitles) return false;
    
    try {
      // Get a copy of the subtitles array
      const subtitles = Array.isArray(currentProject.data.subtitles)
        ? [...currentProject.data.subtitles]
        : [];
      
      // Check if the index is valid
      if (subtitleIndex < 0 || subtitleIndex >= subtitles.length) return false;

      const currentSubtitle = subtitles[subtitleIndex];
      
      // Check if the text is empty after trimming - if so, delete the subtitle
      if (newText.trim() === "") {
        // Remove the subtitle
        subtitles.splice(subtitleIndex, 1);
      } else {
        const totalDuration = currentSubtitle.end - currentSubtitle.start;
        
        // Check if text contains blank lines (two consecutive newlines)
        if (newText.includes("\n\n")) {
          // Split the text by blank lines and process each part
          const parts = newText.split("\n\n")
            .map(part => part.trim())
            .filter(part => part.length > 0);
          
          if (parts.length > 1) {
            // Calculate the total character count for time distribution
            const totalChars = parts.reduce((sum, part) => sum + part.length, 0);
            
            // Create new subtitle cues with corrected approach to avoid reference error
            const newSubtitles: SubtitleCue[] = [];
            
            // Process each part and build the newSubtitles array incrementally
            for (let idx = 0; idx < parts.length; idx++) {
              const part = parts[idx];
              // Calculate time proportion based on character count
              const proportion = part.length / totalChars;
              const segmentDuration = totalDuration * proportion;
              
              // For first segment, start time is the same as original
              // For others, use the end time of the previous segment
              const start = idx === 0 
                ? currentSubtitle.start 
                : newSubtitles[idx - 1].end;
                
              // Calculate end time based on proportion
              const end = idx === parts.length - 1
                ? currentSubtitle.end
                : start + segmentDuration;
                
              newSubtitles.push({
                start,
                end,
                text: part,
                settings: currentSubtitle.settings
              });
            }
            
            // Remove the original subtitle and insert the new ones
            subtitles.splice(subtitleIndex, 1, ...newSubtitles);
          } else {
            // If only one part after filtering, just update the text
            subtitles[subtitleIndex] = {
              ...currentSubtitle,
              text: parts[0] || "",
            };
          }
        } else {
          // No blank lines, just update the text
          subtitles[subtitleIndex] = {
            ...currentSubtitle,
            text: newText,
          };
        }
      }

      // Update the project with the modified subtitles
      const updatedProject = await updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          subtitles,
        },
        updatedAt: Date.now(),
      });

      projectStore.setKey("currentProject", updatedProject);
      return true;
    } catch (error) {
      console.error("Failed to update subtitle text:", error);
      return false;
    }
  },
  
  // Adjust subtitle timing with keyboard shortcuts
  adjustSubtitleTiming: async (subtitleIndex: number, adjustType: 'startTime' | 'endTime', amount: number) => {
    const { currentProject } = projectStore.get();
    if (!currentProject || !currentProject.data?.subtitles) return false;
    
    try {
      // Get a copy of the subtitles array
      const subtitles = Array.isArray(currentProject.data.subtitles)
        ? [...currentProject.data.subtitles]
        : [];
      
      // Check if the index is valid
      if (subtitleIndex < 0 || subtitleIndex >= subtitles.length) return false;

      const currentSubtitle = subtitles[subtitleIndex];
      
      // Round to nearest 100ms
      const roundToNearest100ms = (time: number) => Math.round(time / 100) * 100;
      
      // Sort subtitles by start time for collision detection
      subtitles.sort((a, b) => a.start - b.start);
      
      // Find the current index after sorting
      const sortedIndex = subtitles.findIndex(s => 
        s.start === currentSubtitle.start && 
        s.end === currentSubtitle.end && 
        s.text === currentSubtitle.text
      );
      
      if (adjustType === 'startTime') {
        // Adjust start time, ensuring it doesn't go beyond 0 or end time
        let newStartTime = Math.max(0, roundToNearest100ms(currentSubtitle.start + amount));
        if (newStartTime >= currentSubtitle.end) return false;
        
        // Check for collision with previous subtitle
        if (amount < 0 && sortedIndex > 0) {
          const prevSubtitle = subtitles[sortedIndex - 1];
          if (newStartTime < prevSubtitle.end) {
            // Adjust the previous subtitle's end time to avoid overlap
            subtitles[sortedIndex - 1] = {
              ...prevSubtitle,
              end: newStartTime
            };
          }
        }
        
        subtitles[sortedIndex] = {
          ...currentSubtitle,
          start: newStartTime
        };
      } else {
        // Adjust end time, ensuring it doesn't go before start time
        let newEndTime = roundToNearest100ms(currentSubtitle.end + amount);
        if (newEndTime <= currentSubtitle.start) return false;
        
        // Check for collision with next subtitle
        if (amount > 0 && sortedIndex < subtitles.length - 1) {
          const nextSubtitle = subtitles[sortedIndex + 1];
          if (newEndTime > nextSubtitle.start) {
            // Adjust the next subtitle's start time to avoid overlap
            subtitles[sortedIndex + 1] = {
              ...nextSubtitle,
              start: newEndTime
            };
          }
        }
        
        subtitles[sortedIndex] = {
          ...currentSubtitle,
          end: newEndTime
        };
      }

      // Update the project with the modified subtitles
      const updatedProject = await updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          subtitles,
        },
        updatedAt: Date.now(),
      });

      projectStore.setKey("currentProject", updatedProject);
      return true;
    } catch (error) {
      console.error("Failed to adjust subtitle timing:", error);
      return false;
    }
  },
};
