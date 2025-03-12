import { Box, Button, Flex, Spinner, Text } from "@radix-ui/themes";
import React, { useEffect, useRef, useState } from "react";
import { projectActions } from "../../stores/projectStore";
import Modal from "../Modal";

interface ImportAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (media: Blob) => void;
}

/**
 * Modal for importing audio or video data from a file and generating waveform
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
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Clean up object URL when component unmounts or file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const createUnblocker = () => {
    let lastTime = performance.now();
    return async () => {
      if (performance.now() - lastTime > 100) {
        await new Promise((resolve) => setTimeout(resolve));
        lastTime = performance.now();
      }
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const isVideoFile = file.type.startsWith("video/");
    setIsVideo(isVideoFile);
    setSelectedFile(file);
    setWaveformData(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Generate waveform data
    setIsProcessing(true);
    try {
      const unblockUi = createUnblocker();

      // Get the basename from the file (useful for debugging)
      // const basename = file.name.replace(/\.[^/.]+$/, "");

      setProcessingStatus("Loading audio file...");
      const buffer = await file.arrayBuffer();

      setProcessingStatus("Decoding audio file...");
      const audioContext = new OfflineAudioContext(1, 1, 16000);
      const audioBuffer = await audioContext.decodeAudioData(buffer);

      setProcessingStatus("Getting waveform...");
      const channelData = audioBuffer.getChannelData(0);
      const waveform = [];
      let max = 0;

      for (let i = 0; i < channelData.length; i += 1600) {
        let sum = 0;
        for (let j = 0; j < 1600; j++) {
          sum += Math.pow(channelData[i + j] || 0, 2);
        }
        const rms = Math.sqrt(sum / 1600);
        waveform.push(rms);
        max = Math.max(max, rms);

        setProcessingStatus(
          `Processing... ${Math.round((i / channelData.length) * 100)}%`
        );
        await unblockUi();
      }

      const normalizedWaveform = waveform.map(
        (value) => Math.round((value / max) * 100) / 100
      );
      setWaveformData(normalizedWaveform);
      setProcessingStatus("Waveform generated successfully!");
    } catch (error) {
      console.error("Error generating waveform:", error);
      setProcessingStatus(
        "Error generating waveform. You can still import the media."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    // First import the waveform if it was successfully generated
    if (waveformData) {
      await projectActions.importWaveform(waveformData);
    }

    // Then import the audio/video file
    onImport(selectedFile);

    // Reset the state
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
    setWaveformData(null);
    setProcessingStatus(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Media">
      <Box>
        <Text size="2" color="gray" mb="3">
          Select an audio or video file to import. The media will be stored with
          your project for playback, and a waveform will be automatically
          generated.
        </Text>
        <Box>
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            disabled={isProcessing}
            style={{
              width: "100%",
              padding: "10px 0",
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          />
        </Box>
        {selectedFile && (
          <Box mt="3">
            <Text size="2" mb="2">
              Selected: {selectedFile.name} (
              {Math.round(selectedFile.size / 1024)} KB)
            </Text>
            {previewUrl && isVideo && (
              <Box
                mt="2"
                style={{
                  maxWidth: "100%",
                  borderRadius: "var(--radius-3)",
                  overflow: "hidden",
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

        {processingStatus && (
          <Box mt="3">
            <Flex align="center" gap="2">
              {isProcessing && <Spinner size="1" />}
              <Text
                size="2"
                color={isProcessing ? "gray" : waveformData ? "green" : "amber"}
              >
                {processingStatus}
              </Text>
            </Flex>
          </Box>
        )}

        <Flex justify="end" mt="4" gap="2">
          <Button
            variant="soft"
            color="gray"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedFile || isProcessing}
            onClick={handleImport}
          >
            {isProcessing ? "Processing..." : "Import"}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};

export default ImportAudioModal;
