import { useStore } from "@nanostores/react";
import {
  DownloadIcon,
  Pencil1Icon,
  SpeakerLoudIcon,
  TextIcon,
  UploadIcon,
  PlayIcon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import { Container, Flex, Text } from "@radix-ui/themes";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImportProjectModal from "../components/project/ImportProjectModal";
import ImportSubtitleModal from "../components/project/ImportSubtitleModal";
import { SubtitleCue } from "../utils/timeline/types";
import ImportWaveformModal from "../components/project/ImportWaveformModal";
import ImportAudioModal from "../components/project/ImportAudioModal";
import ProjectContent from "../components/project/ProjectContent";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectMenu from "../components/project/ProjectMenu";
import RenameProjectModal from "../components/project/RenameProjectModal";
import { projectActions, projectStore } from "../stores/projectStore";

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, isLoading, error } = useStore(projectStore);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportWaveformModalOpen, setIsImportWaveformModalOpen] =
    useState(false);
  const [isImportSubtitleModalOpen, setIsImportSubtitleModalOpen] =
    useState(false);
  const [isImportAudioModalOpen, setIsImportAudioModalOpen] = useState(false);

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
  
  const handleExportVTT = () => {
    const exportData = projectActions.exportVTT();
    if (!exportData) return;

    const { vttData, filename } = exportData;
    const blob = new Blob([vttData], { type: "text/vtt" });
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

  const handleImportWaveform = async (waveform: number[]) => {
    const success = await projectActions.importWaveform(waveform);
    if (success) {
      setIsImportWaveformModalOpen(false);
    }
  };

  const handleImportSubtitles = async (subtitles: SubtitleCue[]) => {
    const success = await projectActions.importSubtitles(subtitles);
    if (success) {
      setIsImportSubtitleModalOpen(false);
    }
  };

  const handleImportAudio = async (audioBlob: Blob) => {
    const success = await projectActions.importAudio(audioBlob);
    if (success) {
      setIsImportAudioModalOpen(false);
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
      label: "Import Waveform",
      icon: <SpeakerLoudIcon width="16" height="16" />,
      onClick: () => setIsImportWaveformModalOpen(true),
    },
    {
      label: "Import Audio/Video",
      icon: <PlayIcon width="16" height="16" />,
      onClick: () => setIsImportAudioModalOpen(true),
    },
    {
      label: "Import Subtitles",
      icon: <TextIcon width="16" height="16" />,
      onClick: () => setIsImportSubtitleModalOpen(true),
    },
    {
      label: "Export",
      icon: <DownloadIcon width="16" height="16" />,
      onClick: handleExport,
    },
    {
      label: "Export VTT",
      icon: <FileTextIcon width="16" height="16" />,
      onClick: handleExportVTT,
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
    <Container maxWidth={"1400px"} py="6">
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

      <ImportWaveformModal
        isOpen={isImportWaveformModalOpen}
        onClose={() => setIsImportWaveformModalOpen(false)}
        onImport={handleImportWaveform}
      />

      <ImportSubtitleModal
        isOpen={isImportSubtitleModalOpen}
        onClose={() => setIsImportSubtitleModalOpen(false)}
        onImport={handleImportSubtitles}
      />

      <ImportAudioModal
        isOpen={isImportAudioModalOpen}
        onClose={() => setIsImportAudioModalOpen(false)}
        onImport={handleImportAudio}
      />
    </Container>
  );
};

export default ProjectPage;
