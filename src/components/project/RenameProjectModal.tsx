import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes";
import React, { useState } from "react";
import Modal from "../Modal";

interface RenameProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newTitle: string) => void;
  currentTitle: string;
}

/**
 * Modal for renaming a project
 */
const RenameProjectModal: React.FC<RenameProjectModalProps> = ({
  isOpen,
  onClose,
  onRename,
  currentTitle,
}) => {
  const [newTitle, setNewTitle] = useState(currentTitle);

  const handleClose = () => {
    setNewTitle(currentTitle);
    onClose();
  };

  const handleRename = () => {
    onRename(newTitle);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Rename Project">
      <Box>
        <Text as="label" size="2" weight="medium" mb="2" className="block">
          Project Title
        </Text>
        <TextField.Root
          placeholder="Enter project title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          autoFocus
        />
        <Flex justify="end" gap="3" mt="4">
          <Button variant="soft" color="gray" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={!newTitle.trim() || newTitle === currentTitle}
          >
            Save
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};

export default RenameProjectModal;