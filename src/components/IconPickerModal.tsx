import React, { useState } from "react";
import { ICON_NAMES, DynamicIcon } from "../utils/iconMap";
import { Search, X } from "lucide-react";

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredIcons = ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="surface w-full max-w-lg p-6 max-h-[80vh] flex flex-col shadow-2xl border border-[var(--border-strong)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="icon-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
          <h2 id="icon-picker-title" className="text-sm font-bold text-slate-100">
            아이콘 선택 (Lucide Icons)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn hover:text-white"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="아이콘 이름 검색 (예: user, search, bell, cart, box)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="control pl-9 text-xs"
            autoFocus
          />
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2 p-1 max-h-96">
          {filteredIcons.map((name) => {
            const isSelected = selectedIcon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelect(name);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition text-center group ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:border-amber-400 hover:bg-[var(--surface-raised)] text-slate-300 hover:text-white"
                }`}
                title={name}
              >
                <DynamicIcon
                  name={name}
                  className="w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform"
                />
                <span className="text-[9px] font-mono truncate w-full">
                  {name}
                </span>
              </button>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-8">
            일치하는 아이콘을 찾을 수 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};
