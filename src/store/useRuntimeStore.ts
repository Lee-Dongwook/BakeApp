import { create } from "zustand";

interface RuntimeState {
  mode: "EDIT" | "PREVIEW";
  setMode: (mode: "EDIT" | "PREVIEW") => void;

  formState: Record<string, any>;
  setFormField: (field: string, value: any) => void;
  resetFormState: () => void;

  workflowResults: Record<string, any>;
  setWorkflowResult: (actionId: string, result: any) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  mode: "EDIT",
  setMode: (mode) => set({ mode }),

  formState: {},
  setFormField: (field, value) =>
    set((state) => ({ formState: { ...state.formState, [field]: value } })),
  resetFormState: () => set({ formState: {} }),

  workflowResults: {},
  setWorkflowResult: (actionId, result) =>
    set((state) => ({
      workflowResults: { ...state.workflowResults, [actionId]: result },
    })),
}));
