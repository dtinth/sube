import React, { ReactNode } from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Dialog, Flex, IconButton, Heading, Box } from '@radix-ui/themes';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Flex justify="between" align="center" mb="3">
          <Dialog.Title>
            <Heading size="4">{title}</Heading>
          </Dialog.Title>
          <Dialog.Close>
            <IconButton variant="ghost" color="gray">
              <Cross2Icon />
            </IconButton>
          </Dialog.Close>
        </Flex>
        <Box>
          {children}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default Modal;