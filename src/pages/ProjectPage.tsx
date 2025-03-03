import {
  DownloadIcon,
  Pencil1Icon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { Container, Flex, Text } from "@radix-ui/themes";
import { useStore } from "@nanostores/react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectContent from "../components/project/ProjectContent";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectMenu from "../components/project/ProjectMenu";
import RenameProjectModal from "../components/project/RenameProjectModal";
import ImportProjectModal from "../components/project/ImportProjectModal";
import { projectActions, projectStore } from "../stores/projectStore";

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, isLoading, error } = useStore(projectStore);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    projectActions.loadProject(id);
  }, [id, navigate]);

  useEffect(() => {
    // Redirect to home if project loading failed
    if (error) {
      navigate("/");
    }
  }, [error, navigate]);

  const handleRename = async (newTitle: string) => {
    const success = await projectActions.renameProject(newTitle);
    if (success) {
      setIsRenameModalOpen(false);
    }
  };

  const handleExport = () => {
    const exportData = projectActions.exportProject();
    if (!exportData) return;
    
    const { jsonData, filename } = exportData;
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (jsonData: string) => {
    const success = await projectActions.importProjectData(jsonData);
    if (success) {
      setIsImportModalOpen(false);
    }
  };

  // Define menu items for the ProjectMenu component
  const menuItems = [
    {
      label: "Rename",
      icon: <Pencil1Icon width="16" height="16" />,
      onClick: () => setIsRenameModalOpen(true),
    },
    {
      label: "Import",
      icon: <UploadIcon width="16" height="16" />,
      onClick: () => setIsImportModalOpen(true),
    },
    {
      label: "Export",
      icon: <DownloadIcon width="16" height="16" />,
      onClick: handleExport,
    },
  ];

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Text color="gray">Loading project...</Text>
      </Flex>
    );
  }

  if (!currentProject) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Text color="red">Project not found</Text>
      </Flex>
    );
  }

  return (
    <Container size="3" py="6">
      <ProjectHeader 
        title={currentProject.title}
        actions={<ProjectMenu items={menuItems} />}
      />

      <ProjectContent projectId={currentProject.id} />

      <RenameProjectModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRename}
        currentTitle={currentProject.title}
      />

      <ImportProjectModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
    </Container>
  );
};

export default ProjectPage;