type ChangeListener = () => void;

let revision = 0;
const listeners = new Set<ChangeListener>();

export const notifyEditorChanged = () => {
  revision += 1;
  listeners.forEach((listener) => listener());
};

export const getEditorRevision = () => revision;

export const subscribeToEditorChanges = (listener: ChangeListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
