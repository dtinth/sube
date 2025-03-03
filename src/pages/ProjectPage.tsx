import {
  ArrowLeftIcon,
  DotsVerticalIcon,
  DownloadIcon,
  Pencil1Icon,
  UploadIcon,
} from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Card,
  Container,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import { Project } from "../types";
import {
  exportProjectToJSON,
  getProject,
  importProjectFromJSON,
  updateProject,
} from "../utils/storage";

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
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
          navigate("/");
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        navigate("/");
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
        title: newTitle,
      });
      setProject(updatedProject);
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error("Failed to rename project:", error);
    }
  };

  const handleExport = () => {
    if (!project) return;

    const jsonData = exportProjectToJSON(project);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_${project.id}.json`;
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
        const updatedProject = await importProjectFromJSON(
          project.id,
          jsonData
        );
        setProject(updatedProject);
        setIsImportModalOpen(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Failed to import project data:", error);
        alert("Failed to import project data. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Text color="gray">Loading project...</Text>
      </Flex>
    );
  }

  if (!project) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Text color="red">Project not found</Text>
      </Flex>
    );
  }

  return (
    <Container size="3" py="6">
      <Flex justify="between" align="center" mb="6">
        <Flex align="center" gap="3">
          <IconButton
            variant="ghost"
            onClick={() => navigate("/")}
            aria-label="Go back"
          >
            <ArrowLeftIcon width="18" height="18" />
          </IconButton>
          <Heading size="5">{project.title}</Heading>
        </Flex>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="soft">
              <DotsVerticalIcon />
              Menu
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={() => setIsRenameModalOpen(true)}>
              <Pencil1Icon width="16" height="16" />
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={handleImportClick}>
              <UploadIcon width="16" height="16" />
              Import
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={handleExport}>
              <DownloadIcon width="16" height="16" />
              Export
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      <Card size="3" style={{ minHeight: "400px" }}>
        <Flex direction="column" align="center" justify="center" gap="4">
          <Text color="gray" size="2">
            Project ID: {project.id}
          </Text>
          <Text size="4" color="gray">
            Project content will be implemented later.
          </Text>
          <Text color="gray">
            This is a placeholder for the project's functionality.
          </Text>
        </Flex>
      </Card>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(project.title);
        }}
        title="Rename Project"
      >
        <Box>
          <Text as="label" size="2" weight="medium" mb="2" display="block">
            Project Title
          </Text>
          <TextField.Root
            placeholder="Enter project title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <Flex justify="end" gap="3" mt="4">
            <Button
              variant="soft"
              color="gray"
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(project.title);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newTitle.trim() || newTitle === project.title}
            >
              Save
            </Button>
          </Flex>
        </Box>
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Project Data"
      >
        <Box>
          <Text size="2" color="gray" mb="3">
            Select a JSON file to import data into this project. This will
            replace the current project data.
          </Text>
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              style={{
                width: "100%",
                padding: "10px 0",
                cursor: "pointer",
              }}
            />
          </Box>
          <Flex justify="end" mt="4">
            <Button
              variant="soft"
              color="gray"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
          </Flex>
        </Box>
      </Modal>
    </Container>
  );
};

export default ProjectPage;
