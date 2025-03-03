import React, { useState, useEffect } from 'react';
import { PlusIcon } from '@radix-ui/react-icons';
import { Container, Heading, Flex, Button, Grid, Box, Text, TextField } from '@radix-ui/themes';
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
    <Container size="3" py="6">
      <Flex justify="between" align="center" mb="6">
        <Heading size="6">My Projects</Heading>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon />
          New Project
        </Button>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" height="9">
          <Text color="gray">Loading projects...</Text>
        </Flex>
      ) : projects.length === 0 ? (
        <Box style={{ backgroundColor: 'var(--gray-2)', textAlign: 'center', borderRadius: 'var(--radius-3)' }} p="6">
          <Heading size="4" as="h2" mb="2" color="gray">No projects yet</Heading>
          <Text color="gray" mb="4">Create your first project to get started</Text>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            Create Project
          </Button>
        </Box>
      ) : (
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Grid>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewProjectTitle('');
        }}
        title="Create New Project"
      >
        <Box>
          <Text as="label" size="2" weight="medium" mb="2" className="block">
            Project Title
          </Text>
          <TextField.Root 
            placeholder="Enter project title"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            autoFocus
          />
          <Flex justify="end" gap="3" mt="4">
            <Button 
              variant="soft" 
              color="gray"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewProjectTitle('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!newProjectTitle.trim()}
            >
              Create
            </Button>
          </Flex>
        </Box>
      </Modal>
    </Container>
  );
};

export default HomePage;