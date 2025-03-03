import { Box, Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef } from "react";
import Modal from "../Modal";
import { z } from "zod";

interface ImportWaveformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (waveform: number[]) => void;
}

// Define schema for waveform validation
const waveformSchema = z.object({
  waveform: z.array(z.number()),
});

/**
 * Modal for importing waveform data from a JSON file
 */
const ImportWaveformModal: React.FC<ImportWaveformModalProps> = ({
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
        const parsedData = JSON.parse(jsonData);
        
        // Validate the data using zod
        const validatedData = waveformSchema.parse(parsedData);
        
        onImport(validatedData.waveform);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Failed to import waveform data:", error);
        alert("Failed to import waveform data. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Waveform Data">
      <Box>
        <Text size="2" color="gray" mb="3">
          Select a JSON file containing waveform data. The file should include a "waveform" 
          property with an array of numbers.
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

export default ImportWaveformModal;