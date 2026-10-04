import type { MarkState } from "@/lib/mascot";

export interface SceneProps {
  playing: boolean;
  onCue?: (state: MarkState) => void;
  onEnded?: () => void;
  label: string;
}
