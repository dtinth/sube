import { Box, Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef } from "react";
import Modal from "../Modal";
import { parseSync } from "subtitle";

interface ImportSubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (subtitles: SubtitleCue[]) => void;
}

export interface SubtitleCue {
  id?: string;
  start: number;
  end: number;
  text: string;
  settings?: string;
}

/**
 * Modal for importing subtitle data from SRT or VTT files
 */
const ImportSubtitleModal: React.FC<ImportSubtitleModalProps> = ({
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
        const content = event.target?.result as string;
        
        // Parse subtitle file (SRT or VTT)
        const nodes = parseSync(content);
        
        // Extract only cue nodes and their data
        const subtitles: SubtitleCue[] = nodes
          .filter(node => node.type === 'cue')
          .map(node => node.data as SubtitleCue);
        
        if (subtitles.length === 0) {
          throw new Error("No subtitle cues found in the file");
        }
        
        onImport(subtitles);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Failed to import subtitle data:", error);
        alert("Failed to import subtitle data. Please check the file format.");
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Subtitle Data">
      <Box>
        <Text size="2" color="gray" mb="3">
          Select a subtitle file (SRT or VTT format) to import.
        </Text>
        <Box>
          <input
            type="file"
            ref={fileInputRef}
            accept=".srt,.vtt"
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

export default ImportSubtitleModal;