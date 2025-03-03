import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, Upload, Download } from 'lucide-react';
import { getProject, updateProject, exportProjectToJSON, importProjectFromJSON } from '../utils/storage';
import { Project } from '../types';
import Modal from '../components/Modal';

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const projectData = await getProject(id);
        if (projectData) {
          setProject(projectData);
          setNewTitle(projectData.title);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, navigate]);

  const handleRename = async () => {
    if (!project || !newTitle.trim()) return;
    
    try {
      const updatedProject = await updateProject({
        ...project,
        title: newTitle
      });
      setProject(updatedProject);
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error('Failed to rename project:', error);
    }
  };

  const handleExport = () => {
    if (!project) return;
    
    const jsonData = exportProjectToJSON(project);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_${project.id}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project?.id) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = event.target?.result as string;
        const updatedProject = await importProjectFromJSON(project.id, jsonData);
        setProject(updatedProject);
        setIsImportModalOpen(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Failed to import project data:', error);
        alert('Failed to import project data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsRenameModalOpen(true)}
            className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            <Edit2 size={18} className="mr-2" />
            Rename
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            <Upload size={18} className="mr-2" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Download size={18} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 min-h-[400px]">
        <div className="text-center text-gray-500">
          <p className="mb-4">Project ID: {project.id}</p>
          <p className="text-xl">Project content will be implemented later.</p>
          <p className="mt-4">This is a placeholder for the project's functionality.</p>
        </div>
      </div>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(project.title);
        }}
        title="Rename Project"
      >
        <div>
          <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title
          </label>
          <input
            type="text"
            id="projectTitle"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project title"
            autoFocus
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(project.title);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!newTitle.trim() || newTitle === project.title}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Project Data"
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Select a JSON file to import data into this project. This will replace the current project data.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectPage;