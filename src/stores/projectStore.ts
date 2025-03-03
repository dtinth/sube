import { map } from 'nanostores';
import { getProject, updateProject, exportProjectToJSON, importProjectFromJSON } from '../utils/storage';
import { Project } from '../types';
import { SubtitleCue } from '../components/project/ImportSubtitleModal';

// Store shape
interface ProjectStoreState {
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

// Initialize the store with default values
export const projectStore = map<ProjectStoreState>({
  currentProject: null,
  isLoading: false,
  error: null,
});

// Actions
export const projectActions = {
  loadProject: async (id: string) => {
    projectStore.setKey('isLoading', true);
    projectStore.setKey('error', null);
    
    try {
      const projectData = await getProject(id);
      if (projectData) {
        projectStore.setKey('currentProject', projectData);
      } else {
        projectStore.setKey('error', 'Project not found');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      projectStore.setKey('error', 'Failed to load project');
    } finally {
      projectStore.setKey('isLoading', false);
    }
  },

  renameProject: async (title: string) => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject || !title.trim()) return;
    
    try {
      const updatedProject = await updateProject({
        ...currentProject,
        title
      });
      projectStore.setKey('currentProject', updatedProject);
      return true;
    } catch (error) {
      console.error('Failed to rename project:', error);
      return false;
    }
  },

  exportProject: () => {
    const currentProject = projectStore.get().currentProject;
    if (!currentProject) return null;
    
    const jsonData = exportProjectToJSON(currentProject);
    return {
      jsonData,
      filename: `${currentProject.title.replace(/\s+/g, '_')}_${currentProject.id}.json`
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
      projectStore.setKey('currentProject', updatedProject);
      return true;
    } catch (error) {
      console.error('Failed to import project data:', error);
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
          waveform
        },
        updatedAt: Date.now()
      });
      projectStore.setKey('currentProject', updatedProject);
      return true;
    } catch (error) {
      console.error('Failed to import waveform:', error);
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
          subtitles
        },
        updatedAt: Date.now()
      });
      projectStore.setKey('currentProject', updatedProject);
      return true;
    } catch (error) {
      console.error('Failed to import subtitles:', error);
      return false;
    }
  }
};