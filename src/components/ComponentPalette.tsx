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
      className={`flex items-center space-x-2 p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab hover:border-amber-500 transition select-none ${
        isDragging ? "opacity-40 border-amber-500" : ""
      }`}
    >
      <div className="text-amber-500">{icon}</div>
      <span className="text-xs font-medium text-slate-200">{label}</span>
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
    <div className="h-full w-full bg-slate-950 p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Components
      </h3>
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
