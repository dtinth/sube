import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getAllProjects, createProject } from '../utils/storage';
import { Project } from '../types';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';

const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    
    try {
      await createProject(newProjectTitle);
      setNewProjectTitle('');
      setIsCreateModalOpen(false);
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus size={20} className="mr-2" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h2>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewProjectTitle('');
        }}
        title="Create New Project"
      >
        <div>
          <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title
          </label>
          <input
            type="text"
            id="projectTitle"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project title"
            autoFocus
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewProjectTitle('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!newProjectTitle.trim()}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;