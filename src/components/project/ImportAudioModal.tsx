import { Box, Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef, useState } from "react";
import Modal from "../Modal";

interface ImportAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (audio: Blob) => void;
}

/**
 * Modal for importing audio data from an audio file
 */
const ImportAudioModal: React.FC<ImportAudioModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is audio
    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file.");
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    onImport(selectedFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Audio">
      <Box>
        <Text size="2" color="gray" mb="3">
          Select an audio file (MP3, WAV, etc.) to import. The audio will be stored
          with your project for playback.
        </Text>
        <Box>
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            onChange={handleFileSelect}
            style={{
              width: "100%",
              padding: "10px 0",
              cursor: "pointer",
            }}
          />
        </Box>
        {selectedFile && (
          <Text size="2" mt="2">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </Text>
        )}
        <Flex justify="end" mt="4" gap="2">
          <Button variant="soft" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedFile}
            onClick={handleImport}
          >
            Import
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};

export default ImportAudioModal;