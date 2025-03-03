export interface Project {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  data?: any; // This will store the project data
}