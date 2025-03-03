import { Card, Flex, Text } from "@radix-ui/themes";
import React from "react";

interface ProjectContentProps {
  projectId: string;
}

/**
 * Displays the main content area of the project
 * Currently just a placeholder, but can be extended later
 */
const ProjectContent: React.FC<ProjectContentProps> = ({ projectId }) => {
  return (
    <Card size="3" style={{ minHeight: "400px" }}>
      <Flex direction="column" align="center" justify="center" gap="4">
        <Text color="gray" size="2">
          Project ID: {projectId}
        </Text>
        <Text size="4" color="gray">
          Project content will be implemented later.
        </Text>
        <Text color="gray">
          This is a placeholder for the project's functionality.
        </Text>
      </Flex>
    </Card>
  );
};

export default ProjectContent;