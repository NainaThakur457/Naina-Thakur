/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TrackClip {
  id: string;
  type: 'video' | 'image' | 'audio' | 'subtitle' | 'overlay';
  title: string;
  url: string;
  start: number;       // Start position in timeline (seconds)
  duration: number;    // Duration in timeline (seconds)
  sourceStart: number; // Crop start within resource (seconds)
  speed: number;       // Playback multiplier (e.g., 1.0, 2.0)
  
  // Custom Visual Filters / Slides Adjustments
  adjustments?: {
    exposure: number;  // -100 to 100
    contrast: number;  // -100 to 100
    saturation: number; // -100 to 100
    temperature: number; // -100 to 100
    hue: number;        // -100 to 100
  };
  
  // Transitions
  transitionIn?: 'none' | 'fade' | 'zoom' | 'blur' | 'slide-left';
  
  // Retouch sliders
  retouch?: {
    skinSmooth: number; // 0 to 100
    faceSlim: number;   // 0 to 100
    eyesEnlarge: number; // 0 to 100
    teethWhite: number;  // 0 to 100
  };

  // Sticker or text layout details
  stylePreset?: string;
  motionPreset?: string;
  scale?: number;     // for keyframe simulation
  posY?: number;      // percentage offset
  
  // Advanced capcut/chroma-key green screen keys
  chromaKey?: boolean;
  chromaKeyThreshold?: number; // 0-100 threshold
}

export interface SoundEffectPreset {
  id: string;
  name: string;
  url: string;
  category: 'Transitions' | 'Cinematic' | 'Beats' | 'Ambiance';
  duration: number;
}

export interface VideoAsset {
  id: string;
  name: string;
  url: string;
  poster: string;
  duration: number;
  category: 'Cinematic' | 'Tech' | 'Retro' | 'Nature' | 'Urban';
}

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  category: 'Cinematic' | 'Backgrounds' | 'Overlay' | 'Cyberpunk';
}

export type ToolCategory = 'Timeline' | 'Audio' | 'FX' | 'Gemini';

export interface EditTool {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  category: ToolCategory;
  description: string;
  actionRequired?: boolean;
}

export interface CaptionEntry {
  start: number;
  end: number;
  text: string;
  style: 'glow-yellow' | 'gradient-pink' | 'highlight-cyan' | 'cyber-green' | 'white';
}

export interface StoryboardScene {
  sceneNumber: number;
  duration: number;
  visualDescription: string;
  narration: string;
  suggestedSFX: string;
  filterPreset: string;
}

export interface StoryboardResponse {
  title: string;
  scenes: StoryboardScene[];
  isSimulated?: boolean;
}
