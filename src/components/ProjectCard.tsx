import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Calendar } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link 
      to={`/project/${project.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200"
    >
      <div className="flex items-center mb-2">
        <Folder className="text-blue-500 mr-2" size={24} />
        <h3 className="text-lg font-semibold text-gray-800 truncate">{project.title}</h3>
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <Calendar size={16} className="mr-1" />
        <span>Updated: {formatDate(project.updatedAt)}</span>
      </div>
    </Link>
  );
};

export default ProjectCard;