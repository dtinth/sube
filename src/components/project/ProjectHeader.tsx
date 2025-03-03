import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Flex, Heading, IconButton } from "@radix-ui/themes";
import React, { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  title: string;
  actions: ReactNode;
}

/**
 * A flexible header component for the project page
 * Accepts title and actions as props, allowing for composable UI
 */
const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  title,
  actions
}) => {
  const navigate = useNavigate();

  return (
    <Flex justify="between" align="center" mb="6">
      <Flex align="center" gap="3">
        <IconButton
          variant="ghost"
          onClick={() => navigate("/")}
          aria-label="Go back"
        >
          <ArrowLeftIcon width="18" height="18" />
        </IconButton>
        <Heading size="5">{title}</Heading>
      </Flex>
      {actions}
    </Flex>
  );
};

export default ProjectHeader;