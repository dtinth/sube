import React from 'react';
import { Link } from 'react-router-dom';
import { FileIcon, ClockIcon } from '@radix-ui/react-icons';
import { Card, Flex, Text, Box, Heading } from '@radix-ui/themes';
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
    <Card asChild size="2" style={{ cursor: 'pointer' }}>
      <Link to={`/project/${project.id}`}>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Box style={{ color: 'var(--accent-9)' }}>
              <FileIcon width="18" height="18" />
            </Box>
            <Heading size="3" as="h3" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.title}
            </Heading>
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