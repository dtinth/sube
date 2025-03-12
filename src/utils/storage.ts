import { del, get, keys, set } from "idb-keyval";
import { v4 as uuidv4 } from "uuid";
import { Project } from "../types";

const PROJECT_PREFIX = "projects/";

// Get all projects
export const getAllProjects = async (): Promise<Project[]> => {
  const allKeys = await keys();
  const projectKeys = allKeys.filter(
    (key) => typeof key === "string" && key.startsWith(PROJECT_PREFIX)
  );

  const projects: Project[] = [];

  for (const key of projectKeys) {
    const project = await get(key);
    if (project) {
      projects.push(project);
    }
  }

  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
};

// Get a project by ID
export const getProject = async (id: string): Promise<Project | null> => {
  const project = await get(`${PROJECT_PREFIX}${id}`);
  return project || null;
};

// Create a new project
export const createProject = async (title: string): Promise<Project> => {
  const id = uuidv4();
  const now = Date.now();

  const project: Project = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    data: {},
  };

  await set(`${PROJECT_PREFIX}${id}`, project);
  return project;
};

// Update a project
export const updateProject = async (project: Project): Promise<Project> => {
  const updatedProject = {
    ...project,
    updatedAt: Date.now(),
  };

  set(`${PROJECT_PREFIX}${project.id}`, updatedProject);
  return updatedProject;
};

const AUDIO_PREFIX = "audio/";

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  // First, get the project to check if it has an audio blob
  const project = await get(`${PROJECT_PREFIX}${id}`);
  
  // Delete the project data
  await del(`${PROJECT_PREFIX}${id}`);
  
  // If there's an audio blob associated with this project, delete it too
  if (project?.data?.audioBlobId) {
    await del(`${AUDIO_PREFIX}${project.data.audioBlobId}`);
  }
};

// Export project data to JSON
export const exportProjectToJSON = (project: Project): string => {
  return JSON.stringify(project, null, 2);
};

// Import project data from JSON
export const importProjectFromJSON = async (
  id: string,
  jsonData: string
): Promise<Project> => {
  try {
    const parsedData = JSON.parse(jsonData);
    const existingProject = await getProject(id);

    if (!existingProject) {
      throw new Error("Project not found");
    }

    const updatedProject: Project = {
      ...existingProject,
      data: parsedData.data || {},
      updatedAt: Date.now(),
    };

    await updateProject(updatedProject);
    return updatedProject;
  } catch (error) {
    console.error("Failed to import project data:", error);
    throw error;
  }
};
