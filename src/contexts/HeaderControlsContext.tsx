import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface HeaderControlsContextType {
  controls: ReactNode;
  setControls: (controls: ReactNode) => void;
  clearControls: () => void;
}

const HeaderControlsContext = createContext<HeaderControlsContextType | null>(null);

export const HeaderControlsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [controls, setControlsState] = useState<ReactNode>(null);

  const setControls = useCallback((node: ReactNode) => setControlsState(node), []);
  const clearControls = useCallback(() => setControlsState(null), []);

  return (
    <HeaderControlsContext.Provider value={{ controls, setControls, clearControls }}>
      {children}
    </HeaderControlsContext.Provider>
  );
};

export const useHeaderControlsSlot = () => {
  const ctx = useContext(HeaderControlsContext);
  if (!ctx) throw new Error('useHeaderControlsSlot must be inside HeaderControlsProvider');
  return ctx.controls;
};

/** Pages call this hook to inject controls into the global header. Cleans up on unmount. */
export const useHeaderControls = (controls: ReactNode) => {
  const ctx = useContext(HeaderControlsContext);
  if (!ctx) throw new Error('useHeaderControls must be inside HeaderControlsProvider');

  useEffect(() => {
    ctx.setControls(controls);
    return () => ctx.clearControls();
  });
};
