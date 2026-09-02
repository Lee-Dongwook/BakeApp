import React from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Box,
  Type,
  MousePointerClick,
  FormInput,
  List,
  Layers,
  CheckSquare,
  ChevronDown,
  Image as ImageIcon,
  Tag,
  Minus,
  FileText,
  Plus,
  Grid as GridIcon,
  Columns,
  Rows,
  Sparkles,
  User,
  ToggleLeft,
  Calendar,
  BarChart2,
  TrendingUp,
  MessageSquare,
  Compass,
  Maximize,
} from "lucide-react";
import { usePageStore, selectActivePage } from "../store/usePageStore";
import { findNodeById, useCanvasStore } from "../store/useCanvasStore";

interface PaletteItemProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  onClickAdd?: () => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({
  type,
  label,
  icon,
  onClickAdd,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, label },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClickAdd}
      className={`surface card-interactive group relative flex cursor-grab items-center justify-between p-2.5 select-none transition-all ${
        isDragging ? "opacity-40 ring-2 ring-amber-500" : ""
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className="brand shrink-0">{icon}</div>
        <span className="text-secondary text-xs font-semibold truncate">
          {label}
        </span>
      </div>
      <button
        type="button"
        className="text-muted group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="클릭하여 추가"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ComponentPalette: React.FC = () => {
  const activePage = usePageStore(selectActivePage);
  const addNode = usePageStore((state) => state.addNode);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);

  const handleAddDirectly = (type: string, label: string) => {
    if (!activePage) return;

    const selected = selectedNodeId
      ? findNodeById(activePage.rootNode, selectedNodeId)
      : null;
    const isParentContainer =
      selected &&
      (selected.type === "Container" ||
        selected.type === "View" ||
        selected.type === "Card" ||
        selected.type === "Form" ||
        selected.type === "Grid" ||
        selected.type === "Row" ||
        selected.type === "Column" ||
        selected.type === "Modal" ||
        selected.type === "Tabs");

    const parentId = isParentContainer ? selected.id : activePage.rootNode.id;
    const newNode = createDefaultNode(type, label);
    addNode(activePage.id, parentId, newNode);
    setSelectedNodeId(newNode.id);
  };

  const categories = [
    {
      name: "레이아웃 & 컨테이너",
      items: [
        { type: "View", label: "Box (컨테이너)", icon: <Box className="w-3.5 h-3.5" /> },
        { type: "Row", label: "Row (가로 정렬)", icon: <Rows className="w-3.5 h-3.5" /> },
        { type: "Column", label: "Column (세로 정렬)", icon: <Columns className="w-3.5 h-3.5" /> },
        { type: "Grid", label: "Grid (2열 그리드)", icon: <GridIcon className="w-3.5 h-3.5" /> },
        { type: "Card", label: "Card (카드)", icon: <Layers className="w-3.5 h-3.5" /> },
        { type: "Modal", label: "Modal (다이얼로그)", icon: <Maximize className="w-3.5 h-3.5" /> },
        { type: "Tabs", label: "Tabs (탭 뷰)", icon: <Compass className="w-3.5 h-3.5" /> },
        { type: "Form", label: "Form (양식)", icon: <FileText className="w-3.5 h-3.5" /> },
        { type: "Divider", label: "Divider (구분선)", icon: <Minus className="w-3.5 h-3.5" /> },
      ],
    },
    {
      name: "타이포 & 미디어",
      items: [
        { type: "Heading", label: "Heading (제목)", icon: <Type className="w-3.5 h-3.5" /> },
        { type: "Text", label: "Text (본문)", icon: <Type className="w-3.5 h-3.5" /> },
        { type: "Icon", label: "Icon (아이콘)", icon: <Sparkles className="w-3.5 h-3.5" /> },
        { type: "Avatar", label: "Avatar (아바타)", icon: <User className="w-3.5 h-3.5" /> },
        { type: "Image", label: "Image (이미지)", icon: <ImageIcon className="w-3.5 h-3.5" /> },
        { type: "Badge", label: "Badge (뱃지)", icon: <Tag className="w-3.5 h-3.5" /> },
      ],
    },
    {
      name: "입력 & 양식 컨트롤",
      items: [
        { type: "TextInput", label: "Input (입력창)", icon: <FormInput className="w-3.5 h-3.5" /> },
        { type: "TextArea", label: "TextArea (여러줄)", icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { type: "Select", label: "Select (드롭다운)", icon: <ChevronDown className="w-3.5 h-3.5" /> },
        { type: "Checkbox", label: "Checkbox (체크박스)", icon: <CheckSquare className="w-3.5 h-3.5" /> },
        { type: "Switch", label: "Switch (스위치)", icon: <ToggleLeft className="w-3.5 h-3.5" /> },
        { type: "DatePicker", label: "DatePicker (날짜)", icon: <Calendar className="w-3.5 h-3.5" /> },
        { type: "Button", label: "Button (버튼)", icon: <MousePointerClick className="w-3.5 h-3.5" /> },
      ],
    },
    {
      name: "데이터 & 대시보드",
      items: [
        { type: "StatCard", label: "StatCard (KPI 지표)", icon: <TrendingUp className="w-3.5 h-3.5" /> },
        { type: "Chart", label: "Chart (바 차트)", icon: <BarChart2 className="w-3.5 h-3.5" /> },
        { type: "DataList", label: "Data List (데이터 목록)", icon: <List className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  return (
    <div className="app-sidebar h-full w-full overflow-y-auto p-4 space-y-5">
      <div className="border-b border-[var(--border-subtle)] pb-2.5">
        <h3 className="eyebrow">Component Palette</h3>
        <p className="text-muted text-[10px] mt-0.5">
          드래그하거나 클릭하여 페이지에 추가합니다.
        </p>
      </div>

      {categories.map((cat) => (
        <div key={cat.name} className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {cat.name}
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {cat.items.map((item) => (
              <PaletteItem
                key={item.type}
                type={item.type}
                label={item.label}
                icon={item.icon}
                onClickAdd={() => handleAddDirectly(item.type, item.label)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export function createDefaultNode(type: string, label: string) {
  const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  switch (type) {
    case "View":
    case "Container":
      return {
        id: newId,
        type: "View",
        name: `${label} ${newId.slice(-3)}`,
        style: {
          padding: 16,
          backgroundColor: "#f8fafc",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        },
        children: [],
      };

    case "Row":
      return {
        id: newId,
        type: "Row",
        name: `Row ${newId.slice(-3)}`,
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        children: [],
      };

    case "Column":
      return {
        id: newId,
        type: "Column",
        name: `Column ${newId.slice(-3)}`,
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 12,
        },
        children: [],
      };

    case "Grid":
      return {
        id: newId,
        type: "Grid",
        name: `Grid ${newId.slice(-3)}`,
        props: { columns: 2 },
        style: {
          gap: 16,
        },
        children: [],
      };

    case "Card":
      return {
        id: newId,
        type: "Card",
        name: `카드 ${newId.slice(-3)}`,
        style: {
          padding: 16,
          backgroundColor: "#ffffff",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        },
        children: [
          {
            id: `node-title-${Date.now()}`,
            type: "Heading",
            name: "카드 제목",
            props: { level: "h3" },
            children: ["새 카드"],
          },
        ],
      };

    case "Modal":
      return {
        id: newId,
        type: "Modal",
        name: `모달 팝업 ${newId.slice(-3)}`,
        props: { modalId: `modal_${newId.slice(-3)}` },
        style: {
          padding: 16,
          backgroundColor: "#ffffff",
          borderRadius: 12,
        },
        children: [
          {
            id: `node-mod-title-${Date.now()}`,
            type: "Heading",
            name: "모달 제목",
            props: { level: "h3" },
            children: ["팝업 알림"],
          },
          {
            id: `node-mod-text-${Date.now()}`,
            type: "Text",
            name: "모달 내용",
            children: ["여기에 모달 본문 내용을 작성하세요."],
          },
        ],
      };

    case "Tabs":
      return {
        id: newId,
        type: "Tabs",
        name: `탭 ${newId.slice(-3)}`,
        props: { tabs: "개요, 상세 정보, 설정" },
        children: [],
      };

    case "Form":
      return {
        id: newId,
        type: "Form",
        name: `양식 ${newId.slice(-3)}`,
        style: {
          padding: 16,
          backgroundColor: "#ffffff",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        },
        children: [],
      };

    case "Heading":
      return {
        id: newId,
        type: "Heading",
        name: `제목 ${newId.slice(-3)}`,
        props: { level: "h2" },
        children: ["대시보드 개요"],
      };

    case "Text":
      return {
        id: newId,
        type: "Text",
        name: `텍스트 ${newId.slice(-3)}`,
        style: { fontSize: 14, color: "#334155" },
        children: ["새 텍스트 내용"],
      };

    case "Icon":
      return {
        id: newId,
        type: "Icon",
        name: `아이콘 ${newId.slice(-3)}`,
        props: { name: "Sparkles", size: 20 },
      };

    case "Avatar":
      return {
        id: newId,
        type: "Avatar",
        name: `아바타 ${newId.slice(-3)}`,
        props: { text: "US", size: 36 },
      };

    case "Button":
      return {
        id: newId,
        type: "Button",
        name: `버튼 ${newId.slice(-3)}`,
        props: { variant: "primary", icon: "" },
        children: ["확인"],
      };

    case "TextInput":
      return {
        id: newId,
        type: "TextInput",
        name: `입력 ${newId.slice(-3)}`,
        props: {
          placeholder: "내용을 입력하세요",
          fieldName: `input_${newId.slice(-3)}`,
        },
      };

    case "TextArea":
      return {
        id: newId,
        type: "TextArea",
        name: `텍스트 영역 ${newId.slice(-3)}`,
        props: {
          placeholder: "상세 내용을 입력하세요",
          fieldName: `content_${newId.slice(-3)}`,
          rows: 3,
        },
      };

    case "Select":
      return {
        id: newId,
        type: "Select",
        name: `선택 ${newId.slice(-3)}`,
        props: {
          fieldName: `select_${newId.slice(-3)}`,
          options: "옵션 1, 옵션 2, 옵션 3",
          placeholder: "-- 선택하세요 --",
        },
      };

    case "Checkbox":
      return {
        id: newId,
        type: "Checkbox",
        name: `체크박스 ${newId.slice(-3)}`,
        props: {
          fieldName: `check_${newId.slice(-3)}`,
          label: "동의합니다",
        },
      };

    case "Switch":
      return {
        id: newId,
        type: "Switch",
        name: `스위치 ${newId.slice(-3)}`,
        props: {
          fieldName: `switch_${newId.slice(-3)}`,
          label: "알림 활성화",
        },
      };

    case "DatePicker":
      return {
        id: newId,
        type: "DatePicker",
        name: `날짜 선택 ${newId.slice(-3)}`,
        props: {
          fieldName: `date_${newId.slice(-3)}`,
        },
      };

    case "StatCard":
      return {
        id: newId,
        type: "StatCard",
        name: `KPI 지표 ${newId.slice(-3)}`,
        props: {
          title: "총 매출액",
          value: "₩2,450,000",
          trend: "+14.8%",
          icon: "TrendingUp",
        },
      };

    case "Chart":
      return {
        id: newId,
        type: "Chart",
        name: `차트 ${newId.slice(-3)}`,
        props: {
          title: "월별 실적 추이",
          chartType: "bar",
          data: [35, 55, 40, 70, 90, 85],
        },
      };

    case "Image":
      return {
        id: newId,
        type: "Image",
        name: `이미지 ${newId.slice(-3)}`,
        props: {
          src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500",
          alt: "맛있는 빵",
        },
      };

    case "Badge":
      return {
        id: newId,
        type: "Badge",
        name: `뱃지 ${newId.slice(-3)}`,
        props: {
          text: "완료됨",
          variant: "success",
        },
      };

    case "Divider":
      return {
        id: newId,
        type: "Divider",
        name: `구분선 ${newId.slice(-3)}`,
      };

    case "DataList":
      return {
        id: newId,
        type: "DataList",
        name: `데이터 목록 ${newId.slice(-3)}`,
        props: { tableName: "", displayField: "", limit: 20 },
      };

    default:
      return {
        id: newId,
        type,
        name: `${label} ${newId.slice(-3)}`,
        children: [],
      };
  }
}
