import { Box, Button, Flex, Text } from "@radix-ui/themes";
import React, { useRef, useState, useEffect } from "react";
import Modal from "../Modal";

interface ImportAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (media: Blob) => void;
}

/**
 * Modal for importing audio or video data from a file
 */
const ImportAudioModal: React.FC<ImportAudioModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // Clean up object URL when component unmounts or file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is audio or video
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      alert("Please select an audio or video file.");
      return;
    }

    // Clean up previous preview if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setIsVideo(file.type.startsWith("video/"));
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    onImport(selectedFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Media">
      <Box>
        <Text size="2" color="gray" mb="3">
          Select an audio or video file to import. The media will be stored
          with your project for playback.
        </Text>
        <Box>
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            style={{
              width: "100%",
              padding: "10px 0",
              cursor: "pointer",
            }}
          />
        </Box>
        {selectedFile && (
          <Box mt="3">
            <Text size="2" mb="2">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </Text>
            {previewUrl && isVideo && (
              <Box 
                mt="2" 
                style={{ 
                  maxWidth: "100%", 
                  borderRadius: "var(--radius-3)",
                  overflow: "hidden" 
                }}
              >
                <video 
                  ref={videoPreviewRef}
                  src={previewUrl} 
                  controls 
                  style={{ width: "100%" }}
                />
              </Box>
            )}
            {previewUrl && !isVideo && (
              <Box mt="2">
                <audio 
                  ref={audioPreviewRef}
                  src={previewUrl} 
                  controls 
                  style={{ width: "100%" }}
                />
              </Box>
            )}
          </Box>
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