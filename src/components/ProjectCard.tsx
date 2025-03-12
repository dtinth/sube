import React from 'react';
import { Link } from 'react-router-dom';
import { FileIcon, ClockIcon, DotsVerticalIcon, TrashIcon } from '@radix-ui/react-icons';
import { Card, Flex, Text, Box, Heading, DropdownMenu, IconButton } from '@radix-ui/themes';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onDeleteRequest: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDeleteRequest }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteRequest(project);
  };

  return (
    <Card size="2" style={{ position: 'relative' }}>
      <Link to={`/project/${project.id}`} style={{ display: 'block', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2" justify="between">
            <Flex align="center" gap="2" style={{ overflow: 'hidden' }}>
              <Box style={{ color: 'var(--accent-9)' }}>
                <FileIcon width="18" height="18" />
              </Box>
              <Heading size="3" as="h3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.title}
              </Heading>
            </Flex>
            
            <Box onClick={(e) => e.preventDefault()} style={{ zIndex: 10 }}>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton variant="ghost" color="gray" size="1" onClick={(e) => e.preventDefault()}>
                    <DotsVerticalIcon />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item color="red" onClick={handleDeleteClick}>
                    <TrashIcon />
                    Delete project
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Box>
          </Flex>
          <Flex align="center" gap="1">
            <ClockIcon width="14" height="14" />
            <Text size="1" color="gray">Updated: {formatDate(project.updatedAt)}</Text>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
};

export default ProjectCard;