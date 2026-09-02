import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Box, Type, MousePointerClick, FormInput, List } from "lucide-react";

interface PaletteItemProps {
  type: string;
  label: string;
  icon: React.ReactNode;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ type, label, icon }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, label },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`surface card-interactive flex cursor-grab items-center space-x-2 p-4 select-none ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="brand">{icon}</div>
      <span className="text-secondary text-xs font-medium">{label}</span>
    </div>
  );
};

export const ComponentPalette: React.FC = () => {
  const items = [
    { type: "View", label: "Box (View)", icon: <Box className="w-4 h-4" /> },
    { type: "Text", label: "Text", icon: <Type className="w-4 h-4" /> },
    {
      type: "Button",
      label: "Button",
      icon: <MousePointerClick className="w-4 h-4" />,
    },
    {
      type: "TextInput",
      label: "Input",
      icon: <FormInput className="w-4 h-4" />,
    },
    {
      type: "DataList",
      label: "Data List",
      icon: <List className="w-4 h-4" />,
    },
  ];

  return (
    <div className="app-sidebar h-full w-full p-6">
      <h3 className="eyebrow mb-4">Components</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <PaletteItem
            key={item.type}
            type={item.type}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
};
