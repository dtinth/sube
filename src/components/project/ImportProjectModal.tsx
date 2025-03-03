import { Box, Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef } from "react";
import Modal from "../Modal";

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonData: string) => void;
}

/**
 * Modal for importing project data from a JSON file
 */
const ImportProjectModal: React.FC<ImportProjectModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        onImport(jsonData);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Project Data">
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
          <Button variant="soft" color="gray" onClick={onClose}>
            Cancel
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};

export default ImportProjectModal;