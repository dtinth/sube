import { Button, Flex, TextArea } from "@radix-ui/themes";
import React, { useEffect, useRef } from "react";
import { projectActions } from "../../stores/projectStore";
import Modal from "../Modal";

interface EditSubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitleIndex: number;
  subtitleText: string;
  subtitleTime: string;
}

const EditSubtitleModal: React.FC<EditSubtitleModalProps> = ({
  isOpen,
  onClose,
  subtitleIndex,
  subtitleText,
  subtitleTime,
}) => {
  const [editText, setEditText] = React.useState(subtitleText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Update local state when props change or when modal opens
    setEditText(subtitleText);
  }, [subtitleText, isOpen]);

  // Auto-focus logic with improved reliability
  useEffect(() => {
    // Auto-focus and select text when modal opens
    if (isOpen && textareaRef.current) {
      // Try immediately
      textareaRef.current.focus();
      textareaRef.current.select();

      // Also try with a small delay to ensure modal is fully rendered
      const timerId = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);

      // Also try with a slightly longer delay as a fallback
      const timerId2 = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 150);

      return () => {
        clearTimeout(timerId);
        clearTimeout(timerId2);
      };
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (editText !== subtitleText) {
      await projectActions.updateSubtitleText(subtitleIndex, editText);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }

    // Escape handled by Modal component
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Subtitle">
      <Flex direction="column" gap="3">
        <div style={{ fontSize: "14px", color: "var(--gray-11)" }}>
          Time: {subtitleTime}
        </div>

        <TextArea
          autoFocus
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          size={"3"}
          style={
            {
              minHeight: "120px",
              width: "100%",
              lineHeight: "1.5",
              resize: "vertical",
              "--font-size-3": "28px",
              "--line-height-3": "36px",
            } as React.CSSProperties
          }
          placeholder="Enter subtitle text..."
        />

        <Flex gap="3" justify="end" mt="2">
          <Button variant="soft" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" onClick={handleSave}>
            Save Changes
          </Button>
        </Flex>

        <div style={{ fontSize: "12px", color: "var(--gray-9)" }}>
          Tip: Press Ctrl+Enter to save
        </div>
        <div
          style={{ fontSize: "12px", color: "var(--gray-9)", marginTop: "4px" }}
        >
          Tip: Add blank lines to split this subtitle into multiple segments
        </div>
      </Flex>
    </Modal>
  );
};

export default EditSubtitleModal;
