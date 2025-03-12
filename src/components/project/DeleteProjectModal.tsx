import React from 'react';
import { Button, Flex, Text } from '@radix-ui/themes';
import Modal from '../Modal';
import { Project } from '../../types';

interface DeleteProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Project">
      <Flex direction="column" gap="4">
        <Text>
          Are you sure you want to delete "{project.title}"? This action cannot be undone.
        </Text>

        <Flex justify="end" gap="3">
          <Button variant="soft" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default DeleteProjectModal;