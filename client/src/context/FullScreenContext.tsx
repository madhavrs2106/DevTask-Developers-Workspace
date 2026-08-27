import { createContext, useContext, useState, type ReactNode } from "react";

interface FullScreenCtx {
  fullScreen: boolean;
  setFullScreen: (v: boolean) => void;
}

const FullScreenContext = createContext<FullScreenCtx>({
  fullScreen: false,
  setFullScreen: () => {},
});

export function FullScreenProvider({ children }: { children: ReactNode }) {
  const [fullScreen, setFullScreen] = useState(false);
  return (
    <FullScreenContext.Provider value={{ fullScreen, setFullScreen }}>
      {children}
    </FullScreenContext.Provider>
  );
}

export const useFullScreen = () => useContext(FullScreenContext);
