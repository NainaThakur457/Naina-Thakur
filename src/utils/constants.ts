import { EditTool, VideoAsset, ImageAsset, SoundEffectPreset } from '../types';

export const TOOLS_LIST: EditTool[] = [
  // --- Category 1: Timeline & Cutting ---
  {
    id: 'tool-trim',
    name: 'Trim & Split',
    icon: 'Scissors',
    category: 'Timeline',
    description: 'Cut timeline segments at the precise frame, trim ends, and split clip sections securely.'
  },
  {
    id: 'tool-ramp',
    name: 'Speed Curve Ramp',
    icon: 'Gauge',
    category: 'Timeline',
    description: 'Vary clips speed continuously using curves (e.g. Montage, Bullet, Hero Zoom) up to 10x.'
  },
  {
    id: 'tool-transitions',
    name: 'Transition Injector',
    icon: 'Sparkles',
    category: 'Timeline',
    description: 'Select professional transitional effects like Cross Dissolve, Cinematic Blur, and Zoom.'
  },
  {
    id: 'tool-overlay',
    name: 'Overlay & PIP',
    icon: 'Layers',
    category: 'Timeline',
    description: 'Add stacked video-in-picture image track layers, coordinate keyframes, and set transparency.'
  },
  {
    id: 'tool-keyframe',
    name: 'Keyframe Animator',
    icon: 'KeyRound',
    category: 'Timeline',
    description: 'Set custom scale, opacity, and path nodes at time points to choreograph smooth custom motion.'
  },
  {
    id: 'tool-aspect',
    name: 'Canvas Aspect Ratio',
    icon: 'Maximize',
    category: 'Timeline',
    description: 'Dynamically reframe workspace canvas dimensions for TikTok (9:16), YouTube (16:9), or Insta (1:1).'
  },

  // --- Category 2: Audio & Rhythm ---
  {
    id: 'tool-beats',
    name: 'AI Beat-Sync',
    icon: 'Music',
    category: 'Audio',
    description: 'Automatically snap clips to musical beats for maximum engagement and flawless tempo edits.'
  },
  {
    id: 'tool-sfx',
    name: 'Pro Sound FX Library',
    icon: 'Volume2',
    category: 'Audio',
    description: 'Incorporate cinema-grade swooshes, dynamic drum beats, and soundscapes instantly.'
  },
  {
    id: 'tool-voice',
    name: 'Voice Changer & Dub',
    icon: 'Mic',
    category: 'Audio',
    description: 'Synthesize professional narrative dubbing directly or apply sound filters (Deep, Chipmunk, Robot).'
  },

  // --- Category 3: Visual FX & Styling ---
  {
    id: 'tool-luts',
    name: 'LUT Color Wheels',
    icon: 'Sliders',
    category: 'FX',
    description: 'Engage creative lookup tables (Cyberpunk, Vintage Teal, Moody Noir) and grade exposure attributes.'
  },
  {
    id: 'tool-filters',
    name: 'Glitch & VHS Filters',
    icon: 'Tv',
    category: 'FX',
    description: 'Simulate retro VHS scans, RGB split chromatic leaks, and modern holographic visual artifacts.'
  },
  {
    id: 'tool-text',
    name: 'Aesthetic Titles',
    icon: 'Type',
    category: 'FX',
    description: 'Introduce glowing neon fonts, futuristic templates with dynamic entrance motion.'
  },
  {
    id: 'tool-retouch',
    name: 'Beauty & Retouch Pro',
    icon: 'Sparkle',
    category: 'FX',
    description: 'Smooth skin surfaces, reshape face geometry, and brighten elements with custom pixel shaders.'
  },

  // --- Category 4: Server-Side Gemini AI ---
  {
    id: 'tool-ai-captions',
    name: 'AI Smart Captions',
    icon: 'MessageSquareText',
    category: 'Gemini',
    description: 'Use Gemini to automatically transcribe story dialogue with dynamic glowing colors and timed text markers.'
  },
  {
    id: 'tool-ai-scriptwriter',
    name: 'AI Scriptwriter Pro',
    icon: 'PenTool',
    category: 'Gemini',
    description: 'Type a content concept and let Gemini draft a multi-scene viral video script & storyboard plan.'
  },
  {
    id: 'tool-ai-bg-replacer',
    name: 'AI Background Painter',
    icon: 'Paintbrush',
    category: 'Gemini',
    description: 'Describe an ambient dreamscape backdrop and harness AI to repaint or remove image backgrounds.'
  },
  {
    id: 'tool-ai-enhancer',
    name: 'AI Video Enhancer',
    icon: 'Activity',
    category: 'Gemini',
    description: 'Instruct Gemini to analyze detail metrics and automatically generate HDR color correction prompts.'
  },
  {
    id: 'tool-ai-generator',
    name: 'AI Storyboard to Video',
    icon: 'Video',
    category: 'Gemini',
    description: 'Generate entirely new simulated cinema clips directly from a semantic text prompt.'
  }
];

export const VIDEO_PRESETS: VideoAsset[] = [
  {
    id: 'v1',
    name: 'Cyberpunk Neon Street',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=400&q=80',
    duration: 15.0,
    category: 'Urban'
  },
  {
    id: 'v2',
    name: 'Ocean Coast Waves',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    duration: 15.0,
    category: 'Nature'
  },
  {
    id: 'v3',
    name: 'Dynamic Drone Forests',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80',
    duration: 15.0,
    category: 'Cinematic'
  },
  {
    id: 'v4',
    name: 'Stunning Nature Run',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
    duration: 15.0,
    category: 'Nature'
  }
];

export const IMAGE_PRESETS: ImageAsset[] = [
  {
    id: 'img1',
    name: 'Retro Diner Glow',
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&q=80',
    category: 'Cinematic'
  },
  {
    id: 'img2',
    name: 'Abstract Paint Liquid',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
    category: 'Overlay'
  },
  {
    id: 'img3',
    name: 'Cyberpunk Workspace',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80',
    category: 'Cyberpunk'
  },
  {
    id: 'img4',
    name: 'Holographic Backdrop',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
    category: 'Backgrounds'
  }
];

export const SFX_PRESETS: SoundEffectPreset[] = [
  {
    id: 'sfx1',
    name: 'Retro Swoosh Transition',
    url: 'https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_roll.ogg',
    category: 'Transitions',
    duration: 2.0
  },
  {
    id: 'sfx2',
    name: 'Cinematic Impact Boom',
    url: 'https://actions.google.com/sounds/v1/science_fiction/alien_hum_continuous.ogg',
    category: 'Cinematic',
    duration: 3.5
  },
  {
    id: 'sfx3',
    name: 'LoFi HipHop Beats',
    url: 'https://actions.google.com/sounds/v1/music/ambient_hum_air_conditioner.ogg',
    category: 'Beats',
    duration: 10.0
  },
  {
    id: 'sfx4',
    name: 'Cybernetic Wind Rise',
    url: 'https://actions.google.com/sounds/v1/ambiences/wind_howling_under_door.ogg',
    category: 'Ambiance',
    duration: 8.0
  }
];

export const LUT_PRESETS = [
  { id: 'lut-none', name: 'None (Rec.709)', style: 'contrast(100%) saturate(100%) hue-rotate(0deg)' },
  { id: 'lut-cyber', name: '⚡ Cyberpunk Neon', style: 'contrast(130%) saturate(160%) hue-rotate(-20deg) brightness(105%)' },
  { id: 'lut-teal', name: '📸 Teal & Orange Cinema', style: 'contrast(115%) saturate(125%) hue-rotate(10deg) sepia(20%) saturate(140%)' },
  { id: 'lut-retro', name: '🎞️ Retro VHS Film', style: 'contrast(95%) saturate(85%) brightness(105%) sepia(35%)' },
  { id: 'lut-moody', name: '🎬 Moody Black & White', style: 'grayscale(100%) contrast(145%) brightness(95%)' },
  // --- New professional CapCut-style filmy filters ---
  { id: 'lut-chrome', name: '🎞️ Vintage Chrome 35mm', style: 'contrast(115%) saturate(110%) sepia(22%) hue-rotate(-5deg) brightness(96%)' },
  { id: 'lut-golden', name: '🌅 Warm Golden Sunset', style: 'brightness(104%) contrast(110%) saturate(145%) sepia(35%) hue-rotate(8deg)' },
  { id: 'lut-indie', name: '🍿 Cozy Indie Vlog', style: 'saturate(80%) contrast(105%) brightness(102%) sepia(10%)' },
  { id: 'lut-matrix', name: '💚 Matrix Cyber Green', style: 'hue-rotate(50deg) saturate(115%) contrast(125%) brightness(95%)' },
  { id: 'lut-pastel', name: '🌸 Dreamy Pastel Cream', style: 'brightness(108%) contrast(90%) saturate(120%) sepia(8%)' },
  { id: 'lut-cold', name: '❄️ Inception Cold Blue', style: 'hue-rotate(-45deg) saturate(110%) contrast(115%)' }
];

export interface ViralHook {
  id: string;
  text: string;
  category: 'Curiosity' | 'Fear' | 'Direct Value' | 'Pattern Interrupt';
  style: 'glow-yellow' | 'gradient-pink' | 'highlight-cyan' | 'cyber-green' | 'white';
}

export const VIRAL_HOOKS: ViralHook[] = [
  { id: 'h1', text: "Stop scrolling if you want to make $10k/mo!", category: 'Curiosity', style: 'glow-yellow' },
  { id: 'h2', text: "The dirty little secret about editing nobody tells you...", category: 'Curiosity', style: 'white' },
  { id: 'h3', text: "Wait! Don't make this simple CapCut mistake!", category: 'Fear', style: 'gradient-pink' },
  { id: 'h4', text: "They are trying to ban this AI tool. Watch now!", category: 'Fear', style: 'highlight-cyan' },
  { id: 'h5', text: "How to edit videos 10x faster using simple keyframes.", category: 'Direct Value', style: 'cyber-green' },
  { id: 'h6', text: "The exact formula I used to gain 100k followers...", category: 'Direct Value', style: 'glow-yellow' },
  { id: 'h7', text: "This is why your content is getting zero views...", category: 'Pattern Interrupt', style: 'gradient-pink' },
  { id: 'h8', text: "I was today years old when I found this out...", category: 'Pattern Interrupt', style: 'white' }
];

export interface ViralMemePreset {
  id: string;
  name: string;
  url: string;
  duration: number;
  chromaKey: boolean;
  category: string;
  poster: string;
}

export const VIRAL_MEMES_PRESETS: ViralMemePreset[] = [
  {
    id: 'm1',
    name: '🐱 Cat Jamming (Green Screen Key)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80',
    duration: 15.0,
    chromaKey: true,
    category: 'Green Screen Memes'
  },
  {
    id: 'm2',
    name: '🕶️ Confused Travolta (Chroma Keyed)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1501430654243-c934ccd2e1c0?w=400&q=80',
    duration: 15.0,
    chromaKey: true,
    category: 'Green Screen Memes'
  },
  {
    id: 'm3',
    name: '🙀 Surprised Guy Screaming Overlay',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
    duration: 15.0,
    chromaKey: true,
    category: 'Green Screen Memes'
  },
  {
    id: 'm4',
    name: '🧗 Dramatic Chipmunk Gaze Loop',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    duration: 15.0,
    chromaKey: true,
    category: 'Green Screen Memes'
  }
];

export const TRANSITION_TYPES = [
  { id: 'none', name: 'Cut (None)' },
  { id: 'fade', name: '🖤 Cross Dissolve (Fade)' },
  { id: 'zoom', name: '🔍 Radial Zoom' },
  { id: 'blur', name: '🌊 Liquid Blur' },
  { id: 'slide-left', name: '👉 Pan Slide Left' }
];
