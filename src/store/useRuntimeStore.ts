import { create } from "zustand";

export type ViewportMode = "mobile" | "mobile-lg" | "tablet" | "desktop";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface RuntimeState {
  mode: "EDIT" | "PREVIEW";
  setMode: (mode: "EDIT" | "PREVIEW") => void;

  viewport: ViewportMode;
  setViewport: (viewport: ViewportMode) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  // Form State (auto-tracked input bindings)
  formState: Record<string, any>;
  setFormField: (field: string, value: any) => void;
  resetFormState: () => void;

  // Page-Local State (e.g. active tab, search filters, temp selection)
  pageState: Record<string, any>;
  setPageStateField: (field: string, value: any) => void;
  resetPageState: () => void;

  // Global App State (shared across pages)
  appState: Record<string, any>;
  setAppStateField: (field: string, value: any) => void;

  // Modal / Dialog Controller
  activeModalId: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Workflow Results
  workflowResults: Record<string, any>;
  setWorkflowResult: (actionId: string, result: any) => void;

  // Toast Notifications
  toasts: ToastItem[];
  addToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
  removeToast: (id: string) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  mode: "EDIT",
  setMode: (mode) => set({ mode }),

  viewport: "mobile",
  setViewport: (viewport) => set({ viewport }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),

  formState: {},
  setFormField: (field, value) =>
    set((state) => ({ formState: { ...state.formState, [field]: value } })),
  resetFormState: () => set({ formState: {} }),

  pageState: {},
  setPageStateField: (field, value) =>
    set((state) => ({ pageState: { ...state.pageState, [field]: value } })),
  resetPageState: () => set({ pageState: {} }),

  appState: {
    theme: "light",
  },
  setAppStateField: (field, value) =>
    set((state) => ({ appState: { ...state.appState, [field]: value } })),

  activeModalId: null,
  openModal: (modalId) => set({ activeModalId: modalId }),
  closeModal: () => set({ activeModalId: null }),

  workflowResults: {},
  setWorkflowResult: (actionId, result) =>
    set((state) => ({
      workflowResults: { ...state.workflowResults, [actionId]: result },
    })),

  toasts: [],
  addToast: (message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
