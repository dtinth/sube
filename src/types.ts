export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  data?: Record<string, unknown>; // This will store the project data
}