export {};

declare global {
  interface DesktopBridge {
    version?: string;
    toggleAlwaysOnTop?: () => Promise<boolean>;
    getAlwaysOnTop?: () => Promise<boolean>;
    onAlwaysOnTopChanged?: (callback: (value: boolean) => void) => (() => void) | void;
    setOpacity?: (value: number) => Promise<number>;
    getOpacity?: () => Promise<number>;
    onOpacityChanged?: (callback: (value: number) => void) => (() => void) | void;
    minimizeWindow?: () => Promise<void>;
    closeWindow?: () => Promise<void>;
  }

  interface Window {
    desktop?: DesktopBridge;
    promptvaultDesktopReady?: boolean;
    require?: NodeRequire;
  }
}
