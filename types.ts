export enum OverlayStyle {
  Classic = 'CLASSIC',
  Neon = 'NEON',
  Comment = 'COMMENT',
  Minimal = 'MINIMAL'
}

export enum AspectRatio {
  Vertical = '9:16',
  Square = '1:1',
  Portrait = '4:5'
}

export interface VideoState {
  file: File | null;
  url: string | null;
  duration: number;
}

export interface OverlayConfig {
  text: string;
  style: OverlayStyle;
  isVisible: boolean;
  positionY: number; // 0 to 100 percentage
}

export interface VideoPlayerRef {
  exportVideo: () => Promise<void>;
}