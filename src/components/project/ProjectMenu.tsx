import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { Button, DropdownMenu } from "@radix-ui/themes";
import React, { ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: "red";
}

interface ProjectMenuProps {
  items: MenuItem[];
}

/**
 * A flexible menu component that can be configured with any menu items
 * Makes it easy to add, remove or reorder menu items without changing component implementation
 */
const ProjectMenu: React.FC<ProjectMenuProps> = ({ items }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft">
          <DotsVerticalIcon />
          Menu
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {items.map((item, index) => (
          <DropdownMenu.Item 
            key={index} 
            onClick={item.onClick} 
            color={item.color}
          >
            {item.icon}
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default ProjectMenu;