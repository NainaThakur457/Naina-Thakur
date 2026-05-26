/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, Sparkles, Wand2, Play, Pause, RefreshCw, Plus, 
  Sliders, Scissors, Type, Music, Download, 
  ArrowRight, Check, Zap, Flame, User, Wifi, Battery, Search,
  ChevronRight, X, Heart, Share2, Layers, AlertCircle, Grid,
  Trash2, LogIn, LogOut, Database, UserCheck, Mic, UploadCloud,
  FileText, Youtube, Volume2, SlidersHorizontal, MessageSquare, CheckCircle2, CloudLightning,
  ChevronLeft, Globe, Headphones, Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFullVoiceDatabase, queryAIVoices, AIVoice, SEED_LANGUAGES, VOICE_STYLES } from '../utils/voiceDatabase';
import { 
  collection, doc, setDoc, getDocs, deleteDoc, 
  query, where, orderBy, serverTimestamp, getDocFromServer
} from 'firebase/firestore';
import { auth, db, googleSignIn, logout } from '../utils/firebaseAuth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import CapClipLogo from './CapClipLogo';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Secure Secure Sync Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Template {
  id: string;
  title: string;
  useCount: string;
  duration: string;
  poster: string;
  category: string;
  videoUrl: string;
  tag: string;
}

// Extensive array representing the robust catalog of templates (Simulating a searchable pagination pool of 4,000+ templates)
const TEMPLATE_PRESETS_CATALOG: Template[] = [
  {
    id: 't-velocity-1',
    title: '⚡ Velocity Drift Beat Edition',
    useCount: '1.2M',
    duration: '8s',
    poster: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Velocity',
    tag: 'VIRAL'
  },
  {
    id: 't-cyber-1',
    title: '🪐 Cyber Lightleak 4K Neon',
    useCount: '840K',
    duration: '12s',
    poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Cyber Rave',
    tag: 'NEW'
  },
  {
    id: 't-retro-1',
    title: '🎞️ Retro VHS Analog 1995',
    useCount: '2.5M',
    duration: '15s',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Retro Film',
    tag: 'HOT'
  },
  {
    id: 't-pastel-1',
    title: '🌸 Dreamy Pastel Warm Coffee',
    useCount: '520K',
    duration: '10s',
    poster: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    category: 'Pastel Vlog',
    tag: 'TRENDING'
  },
  {
    id: 't-beat-1',
    title: '🥁 Trap Drop Bass Shaker',
    useCount: '3.1M',
    duration: '7s',
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Beats & Drops',
    tag: 'ULTRA BEAT'
  },
  {
    id: 't-luxe-1',
    title: '💎 Golden Hour Luxury Yacht',
    useCount: '440K',
    duration: '14s',
    poster: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Luxury Aesthetics',
    tag: 'PREMIUM'
  },
  {
    id: 't-velocity-2',
    title: '🏎️ Neon Asphalt Drift Max',
    useCount: '980K',
    duration: '11s',
    poster: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Velocity',
    tag: 'TOP CHART'
  },
  {
    id: 't-cyber-2',
    title: '🧬 Hackers Grid Hologram Matrix',
    useCount: '310K',
    duration: '9s',
    poster: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Cyber Rave',
    tag: 'GLITCH'
  },
  {
    id: 't-retro-2',
    title: '🍿 Vintage Drive-In Cinema Vlog',
    useCount: '1.7M',
    duration: '13s',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    category: 'Retro Film',
    tag: 'NOSTALGIC'
  },
  {
    id: 't-pastel-2',
    title: '🍓 Organic Sunshine Oats Vlog',
    useCount: '620K',
    duration: '16s',
    poster: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Pastel Vlog',
    tag: 'CREATOR'
  },
  {
    id: 't-beat-2',
    title: '🎹 Chillstep Echo Sunset Rise',
    useCount: '2.2M',
    duration: '10s',
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Beats & Drops',
    tag: 'SYNTH'
  },
  {
    id: 't-luxe-2',
    title: '🥂 Rooftop Champagne Skyline',
    useCount: '1.1M',
    duration: '12s',
    poster: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Luxury Aesthetics',
    tag: 'GLAMOUR'
  }
];

interface RecentProject {
  id: string;
  title: string;
  duration: string;
  date: string;
  poster: string;
  videoUrl: string;
}

const RECENT_PROJECTS: RecentProject[] = [
  {
    id: 'p-sunset',
    title: 'Sunset Travel Vlog.mp4',
    duration: '12.4s',
    date: '2 hours ago',
    poster: 'https://images.unsplash.com/photo-1472214222541-d510753a8707?w=300&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 'p-drift',
    title: 'Neon Drift Reel.mov',
    duration: '6.0s',
    date: 'Yesterday',
    poster: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  }
];

interface CloudExport {
  id: string;
  title: string;
  prompt: string;
  videoUrl: string;
  duration: string;
  posterUrl: string;
  createdAt: any;
  userId: string;
}

export default function CapCutMobileSimulator() {
  const [screen, setScreen] = useState<'home' | 'editor'>('home');
  const [bottomHomeNavTab, setBottomHomeNavTab] = useState<'studio' | 'templates' | 'library'>('studio');
  
  // Active Video references
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(TEMPLATE_PRESETS_CATALOG[0].videoUrl);
  const [activeTitle, setActiveTitle] = useState<string>(TEMPLATE_PRESETS_CATALOG[0].title);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackTime, setPlaybackTime] = useState<number>(3.2);
  const [totalTime, setTotalTime] = useState<number>(10.0);

  // Authenticated Firestore State hooks
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [cloudExports, setCloudExports] = useState<CloudExport[]>([]);
  const [loadingCloud, setLoadingCloud] = useState<boolean>(false);

  // Video setting adjustments inside simulator
  const [activeLut, setActiveLut] = useState<string>('lut-none');
  const [appliedFilters, setAppliedFilters] = useState({
    exposure: 10,
    contrast: 15,
    saturation: 10
  });

  const [activeCaptions, setActiveCaptions] = useState<string>('🔥 Ready. Tap any dynamic action or prompt the AI above!');
  const [activeCaptionStyle, setActiveCaptionStyle] = useState<string>('glow-yellow');

  // Dynamic toast alerts
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentToolTab, setCurrentToolTab] = useState<'none' | 'cut' | 'text' | 'audio' | 'voice' | 'extract' | 'luts' | 'trans' | 'retouch' | 'controls'>('controls');
  
  // Advanced Editing Controls & Customizable Workspace States
  const [selectedTrack, setSelectedTrack] = useState<'video' | 'audio' | 'subtitles'>('video');
  const [activeControlSubTab, setActiveControlSubTab] = useState<'speed' | 'color' | 'overlay' | 'advanced'>('speed');
  const [workspaceLayout, setWorkspaceLayout] = useState<'compact' | 'pro'>('pro');
  const [showMoreToolsPanel, setShowMoreToolsPanel] = useState<boolean>(false);
  const [chromaKeyEnabled, setChromaKeyEnabled] = useState<boolean>(false);
  const [chromaKeyColor, setChromaKeyColor] = useState<string>('#22c55e'); // Green screen color
  const [activeBlendMode, setActiveBlendMode] = useState<string>('normal');
  const [activeCurveSpeed, setActiveCurveSpeed] = useState<string>('normal');
  const [motionBlurAmount, setMotionBlurAmount] = useState<number>(30);
  const [aiEnhanceActive, setAiEnhanceActive] = useState<boolean>(false);
  const [timelineKeyframes, setTimelineKeyframes] = useState<number[]>([2.5, 7.5]); // Interactive keyframe timestamp markers
  const [pinnedTools, setPinnedTools] = useState<string[]>(['Speed Control', 'Chroma Key', 'AI Enhance']);

  // Custom audio variables
  const [audioSpectrumActive, setAudioSpectrumActive] = useState<boolean>(false);
  const [activeAudioBeatTrack, setActiveAudioBeatTrack] = useState<string | null>(null);
  const [extractedAudioName, setExtractedAudioName] = useState<string | null>(null);
  const [isExtractingAudio, setIsExtractingAudio] = useState<boolean>(false);

  // Video segments markers
  const [videoSegments, setVideoSegments] = useState<number[]>([0, 50, 100]); 

  // Rendering Export modal states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportTypeChosen, setExportTypeChosen] = useState<'none' | 'mp4' | 'gallery' | 'pdf'>('none');

  // Interactive Social Sharing Panel states
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [sharingPlatform, setSharingPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'facebook'>('instagram');
  const [shareCaptionText, setShareCaptionText] = useState<string>('Tuned with brand new advanced AI! 🎬⚡ #AdvancedAIVideo #CapClipIntelligent');
  const [isPublishingShare, setIsPublishingShare] = useState<boolean>(false);
  const [shareSuccessNotification, setShareSuccessNotification] = useState<boolean>(false);

  // AI text generation script input
  const [textVideoPrompt, setTextVideoPrompt] = useState<string>('');
  const [lastAiPrompt, setLastAiPrompt] = useState<string>('Dynamic auto curation');
  const [generatingVideo, setGeneratingVideo] = useState<boolean>(false);

  // AI Real Voice synthesis states
  const [voiceScriptText, setVoiceScriptText] = useState<string>('Subscribe and hit follow to see how I make viral TikTok loops in 5 seconds!');
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<string>('voice-model-1000');
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState<boolean>(false);

  // Mobile Voice Catalog states
  const [mobVoiceSearchQuery, setMobVoiceSearchQuery] = useState<string>('');
  const [mobVoiceRegionFilter, setMobVoiceRegionFilter] = useState<string>('All');
  const [mobVoiceGenderFilter, setMobVoiceGenderFilter] = useState<string>('All');
  const [mobVoiceStyleFilter, setMobVoiceStyleFilter] = useState<string>('All');
  const [mobVoicePageIndex, setMobVoicePageIndex] = useState<number>(0);

  // Precision Mobile Timeline zoom state
  const [mobZoom, setMobZoom] = useState<number>(1.0);

  // Mobile Transition systems
  const [activeTransition, setActiveTransition] = useState<string>('none');
  const [transitionFlash, setTransitionFlash] = useState<boolean>(false);

  // Mobile Retouch systems
  const [skinSmoothness, setSkinSmoothness] = useState<number>(45);
  const [eyeEnlarger, setEyeEnlarger] = useState<number>(20);
  const [jawController, setJawController] = useState<number>(15);
  const [teethWhitening, setTeethWhitening] = useState<number>(30);

  // Mobile Capital subtitles types styles state
  const [mobileSubtitleStyle, setMobileSubtitleStyle] = useState<string>('glow-yellow');

  // 4,000+ Database templates searching / pagination states
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('All');
  const [templateCatalogPageNum, setTemplateCatalogPageNum] = useState<number>(1);
  const [jumpPageInputVal, setJumpPageInputVal] = useState<string>('');

  const VOICE_PROFILES = [
    { id: 'liam', name: 'Oliver 🎙️ (Deep British Documentary, Male)', previewText: 'Cinematic prose with clean base depth.' },
    { id: 'emily', name: 'Emily 🌸 (Warm Lifestyle Chat, Female)', previewText: 'Cheerful vlog tone suited for food and traveling.' },
    { id: 'marcus', name: 'Marcus 🔥 (High Energy Coach, Male)', previewText: 'Motivational shout to maximize video user retentions!' },
    { id: 'sophia', name: 'Sophia ✨ (ASMR Soft Whisper, Female)', previewText: 'Whispered voice for high-fidelity ambient reviews.' },
    { id: 'evelyn', name: 'Evelyn 📡 (Cyber News Anchor, Female)', previewText: 'Balanced AI assistant reading futuristic script logs.' }
  ];

  // User upload clips (files mock database for testing upload)
  const [uploadedUserClips, setUploadedUserClips] = useState<Array<{ name: string; type: 'video' | 'audio'; previewUrl: string; size: string }>>([
    {
      name: 'RAW_POV_RIDE.mov',
      type: 'video',
      previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      size: '22 MB'
    },
    {
      name: 'VLOG_MUSIC_RHYTHM.wav',
      type: 'audio',
      previewUrl: 'https://actions.google.com/sounds/v1/music/ambient_hum_air_conditioner.ogg',
      size: '3.4 MB'
    }
  ]);

  const [dragOverActive, setDragOverActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Clear or increment timeline playhead playback loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && screen === 'editor') {
      timer = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= totalTime) return 0;
          return parseFloat((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalTime, screen]);

  // Firebase auth state subscription
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (loggedUser) => {
      setUser(loggedUser);
      if (loggedUser) {
        fetchExports(loggedUser.uid);
      } else {
        setCloudExports([]);
      }
    });
    return () => unsub();
  }, []);

  // Fetch cloud backup clips safely
  const fetchExports = async (uid: string) => {
    setLoadingCloud(true);
    const path = 'exports';
    try {
      const q = query(collection(db, path), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const items: CloudExport[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          title: data.title || 'Untitled_AI.mp4',
          prompt: data.prompt || 'Generated Script',
          videoUrl: data.videoUrl || '',
          duration: data.duration || '10s',
          posterUrl: data.posterUrl || '',
          createdAt: data.createdAt,
          userId: data.userId
        });
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      setCloudExports(items);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoadingCloud(false);
    }
  };

  const handleAuthSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        flashStatus(`🔑 Securely connected to Cloud as: ${result.user.displayName || 'Authorized Creator'}`);
        fetchExports(result.user.uid);
      }
    } catch (e) {
      flashStatus('⭐ Sign-in process timed out or cancelled.');
    }
  };

  const handleAuthSignOut = async () => {
    await logout();
    setUser(null);
    setCloudExports([]);
    flashStatus('🔒 Disconnected safely from Cloud nodes.');
  };

  const handleDeleteExport = async (id: string) => {
    if (!user) return;
    const path = `exports/${id}`;
    try {
      await deleteDoc(doc(db, 'exports', id));
      flashStatus('🗑️ Cloud snapshot wiped securely.');
      fetchExports(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  // Automated scene slices
  const handleAutoEdit = () => {
    flashStatus("🤖 AI Analyzing scenery segment parameters, sound transients & contrast levels...");
    setTimeout(() => {
      setVideoSegments([0, 15, 30, 45, 60, 75, 90, 100]);
      setActiveLut('lut-cyber');
      setActiveCaptions('⚡ AI CINEMATIC EDIT SNAPPED TO TRANSIENT TRANSLATIONS! ⚡');
      setActiveCaptionStyle('gradient-pink');
      setPlaybackTime(0);
      setIsPlaying(true);
      flashStatus("✅ AI Dynamic Auto Edit processed! Applied cyber glow modifiers.");
    }, 1500);
  };

  // AI Script to Video Generator
  const handleTextToVideoGenerate = () => {
    if (!textVideoPrompt.trim()) {
      flashStatus("⚠️ Input a script idea prompt to begin!");
      return;
    }

    setGeneratingVideo(true);
    setLastAiPrompt(textVideoPrompt);
    flashStatus("🎬 Real-time script mapping with AI Content delivery engine...");

    setTimeout(() => {
      const pText = textVideoPrompt.toLowerCase();
      let matchedIndex = 0;

      if (pText.includes('cyber') || pText.includes('neon') || pText.includes('street')) {
        matchedIndex = 1;
        setActiveLut('lut-cyber');
        setActiveCaptionStyle('highlight-cyan');
        setActiveCaptions(`🌌 [AI Script] "A fluorescent cyberpunk metropolis shining in neon rain."`);
      } else if (pText.includes('retro') || pText.includes('vhs') || pText.includes('film')) {
        matchedIndex = 2;
        setActiveLut('lut-retro');
        setActiveCaptionStyle('glow-yellow');
        setActiveCaptions(`🎞️ [AI Script] "Warm analogue filters replicating 1995 vintage cinema tape."`);
      } else if (pText.includes('past') || pText.includes('vlog') || pText.includes('coffee') || pText.includes('cream')) {
        matchedIndex = 3;
        setActiveLut('lut-pastel');
        setActiveCaptionStyle('gradient-pink');
        setActiveCaptions(`🌸 [AI Script] "Organic aesthetics of cozy vlog highlights and soft memories."`);
      } else if (pText.includes('beat') || pText.includes('trap') || pText.includes('drum')) {
        matchedIndex = 4;
        setActiveLut('lut-matrix');
        setActiveCaptionStyle('cyber-green');
        setActiveCaptions(`🥁 [AI Script] "Heavy transient bass spikes driving high frame-rate velocity loops."`);
      } else {
        matchedIndex = Math.floor(Math.random() * TEMPLATE_PRESETS_CATALOG.length);
        setActiveLut('lut-golden');
        setActiveCaptionStyle('white');
        setActiveCaptions(`💎 [AI Script] "Exotic creative sequences mapped by artificial parameters."`);
      }

      const selection = TEMPLATE_PRESETS_CATALOG[matchedIndex] || TEMPLATE_PRESETS_CATALOG[0];
      setActiveVideoUrl(selection.videoUrl);
      setActiveTitle(`AI_GEN_${selection.category.replace(' ', '_').toUpperCase()}.mp4`);
      
      setGeneratingVideo(false);
      setScreen('editor');
      setIsPlaying(true);
      setPlaybackTime(0);
      setTextVideoPrompt('');
      flashStatus(`✨ Created AI Video from script! Timeline initialized.`);
    }, 2800);
  };

  // AI Voice Synthesis with selection of models
  const handleSynthesizeAiVoice = () => {
    if (!voiceScriptText.trim()) {
      flashStatus("⚠️ Type text first to synthesize AI Speech.");
      return;
    }

    setIsSynthesizingVoice(true);
    
    const allVoices = getFullVoiceDatabase();
    const activeVoice = allVoices.find(v => v.id === selectedVoiceProfile) || allVoices[0];
    
    flashStatus(`🎙️ Connecting to neural voice channel for ${activeVoice.name}...`);

    // Play pleasant pitch sound fallback inside browser SpeechSynthesis
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(voiceScriptText);
        utterance.pitch = activeVoice.pitch;
        utterance.rate = activeVoice.rate;
        if (window.speechSynthesis.getVoices) {
          const sysVoices = window.speechSynthesis.getVoices();
          const matchedVoice = sysVoices.find(v => v.lang.startsWith(activeVoice.languageCode.slice(0, 2)));
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.log('Mobile SpeechSynthesis browser permissions restrictions.');
    }

    setTimeout(() => {
      setIsSynthesizingVoice(false);
      const shortName = activeVoice.name.replace(' 🎙️', '');
      setActiveCaptions(`🎙️ [${shortName} - ${activeVoice.language}]: "${voiceScriptText}"`);
      
      // Inject selected state subtitle layout
      setActiveCaptionStyle(mobileSubtitleStyle);
      setExtractedAudioName(`Speech_VO_${activeVoice.name.replace(' 🎙️', '').replace(' ', '_')}.mp3`);
      setAudioSpectrumActive(true);
      flashStatus(`✅ Synthesized ${shortName} (${activeVoice.language}) synced to timeline!`);
    }, 1800);
  };

  // Extract Audio track from user's custom clip
  const handleExtractAudioTrack = (clipName: string) => {
    setIsExtractingAudio(true);
    flashStatus(`🎵 De-muxing sound metadata from "${clipName}" ...`);

    setTimeout(() => {
      setIsExtractingAudio(false);
      setExtractedAudioName(`EXTRACTED_AUDIO_${clipName.toUpperCase().replace(/\.[^/.]+$/, "")}.wav`);
      setAudioSpectrumActive(true);
      setActiveAudioBeatTrack(`Extracted Sound Stem (${clipName})`);
      flashStatus(`✅ Successfully extracted high density audio wave from clip!`);
    }, 2000);
  };

  // Custom User File selector and uploader Simulation
  const handleUserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      addNewMockClip(file.name, file.type.includes('video') ? 'video' : 'audio', file.size);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      addNewMockClip(file.name, file.type.includes('video') ? 'video' : 'audio', file.size);
    }
  };

  const addNewMockClip = (filename: string, filetype: 'video' | 'audio', rawSize: number | string) => {
    let formattedSize = '1.5 MB';
    if (typeof rawSize === 'number') {
      formattedSize = `${(rawSize / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      formattedSize = rawSize;
    }

    const newObj = {
      name: filename,
      type: filetype,
      previewUrl: filetype === 'video' 
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' 
        : 'https://actions.google.com/sounds/v1/music/ambient_hum_air_conditioner.ogg',
      size: formattedSize
    };
    setUploadedUserClips([newObj, ...uploadedUserClips]);
    flashStatus(`📁 Added folder clip: ${filename} to user storage.`);
  };

  // 4,000+ Search filters
  const getFilteredTemplates = () => {
    return TEMPLATE_PRESETS_CATALOG.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(templateSearchQuery.toLowerCase());
      const matchesCategory = selectedTemplateCategory === 'All' || item.category === selectedTemplateCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInputVal, 10);
    if (pageNum >= 1 && pageNum <= 334) {
      setTemplateCatalogPageNum(pageNum);
      flashStatus(`📖 Jumped to Catalog Index Page ${pageNum} of 334 (4008 Templates)`);
    } else {
      flashStatus("⚠️ Valid page range is 1 to 334.");
    }
    setJumpPageInputVal('');
  };

  // Perform Final Video Compiling / Exports Choice
  const startExportAction = (type: 'mp4' | 'gallery' | 'pdf') => {
    setExportTypeChosen(type);
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);

    const intv = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intv);
          setIsExporting(false);
          setExportSuccess(true);
          
          if (type === 'pdf') {
            generateAndDownloadPDFStoryboard();
          } else if (type === 'mp4') {
            downloadSampleMP4();
          } else {
            flashStatus("💾 Saved 4K Cinema output to secure Mobile Camera Roll.");
          }
          saveToSecureCloud();
          return 100;
        }
        return prev + 12;
      });
    }, 120);
  };

  // Storyboard PDF Generator Download callback
  const generateAndDownloadPDFStoryboard = () => {
    const filename = `${activeTitle.replace(/\.[^/.]+$/, "")}_STORYBOARD.html`;
    const mockPdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cinematic Video Storyboard PDF - ${activeTitle}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1e293b; padding: 40px; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 5px; }
          .meta-info { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; }
          .scene-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 25px; background: #fff; }
          .scene-header { background: #4f46e5; color: white; padding: 10px 15px; font-weight: bold; font-family: monospace; display: flex; justify-content: space-between; }
          .scene-body { display: grid; grid-template-cols: 220px 1fr; gap: 20px; padding: 15px; }
          .thumbnail { width: 220px; height: 124px; background: #1e1b4b; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #818cf8; overflow: hidden; position: relative; }
          .thumbnail img { width: 100%; height: 100%; object-cover: cover; }
          .scene-details { font-size: 14px; line-height: 1.5; }
          .narration-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px; margin-top: 10px; font-style: italic; border-radius: 4px; }
          .print-btn { background: #4f46e5; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; float: right; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <button class="print-btn" onclick="window.print()">Print Storyboard as PDF</button>
          <h1>🎬 Advanced Creative Storyboard Blueprint</h1>
          <p style="color:#64748b; margin-top:0;">Exported securely from capclip Intelligent AI Simulator</p>
          
          <div class="meta-info">
            <div>
              <strong>Original Track Title:</strong> ${activeTitle}<br/>
              <strong>Export Format Blueprint:</strong> Storyboard PDF Document<br/>
              <strong>Visual Grading:</strong> ${activeLut.toUpperCase()} Filter<br/>
              <strong>Playback Duration:</strong> ${totalTime} seconds
            </div>
            <div>
              <strong>Creator Account:</strong> ${user ? user.displayName : 'Guest Editor'}<br/>
              <strong>User ID Core Signature:</strong> ${user ? user.uid.substring(0, 12).toUpperCase() : 'GUEST_MEMBERSHIP'}<br/>
              <strong>Compilation Date:</strong> ${new Date().toLocaleString()}<br/>
            </div>
          </div>

          <div class="scene-card">
            <div class="scene-header">
              <span>SCENE 1: INTRODUCTION SEQUENCE</span>
              <span>TIME RANGE: 0.0s - 3.5s</span>
            </div>
            <div class="scene-body">
              <div class="thumbnail">
                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=220&q=80" alt="Pre" />
              </div>
              <div class="scene-details">
                <strong>Visual Prompt Scenario:</strong> Mapped frame elements with glow modifiers. High action focus.<br/>
                <strong>Active Overlay Captions Track:</strong> ${activeCaptions}<br/>
                <div class="narration-box">
                  <strong>AI Generated Dialogue Script Narrations:</strong><br/>
                  "${voiceScriptText}"
                </div>
              </div>
            </div>
          </div>

          <div class="scene-card">
            <div class="scene-header">
              <span>SCENE 2: ENGAGEMENT TRANSIENT TRANSIT</span>
              <span>TIME RANGE: 3.5s - 10.0s</span>
            </div>
            <div class="scene-body">
              <div class="thumbnail">
                <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=220&q=80" alt="Pre" />
              </div>
              <div class="scene-details">
                <strong>Visual Prompt Scenario:</strong> Transient synchronized beat divisions driving keyframe scaling. Cyber effects active.<br/>
                <strong>Active Overlay Captions Track:</strong> ${activeCaptions ? 'Synchronized Voice Translation Block' : 'Ambient background Audio track'}<br/>
                <div class="narration-box">
                  <strong>AI Generated Dialogue Script Narrations:</strong><br/>
                  "Automatically synced voiceovers read through deep neural voices."
                </div>
              </div>
            </div>
          </div>

          <p style="text-align:center; font-size:11px; color:#94a3b8; margin-top:40px; border-top:1px solid #e2e8f0; padding-top:20px;">
            Document Generated in Sandbox Container Node. Powered by CapClip Secure Cloud Backend.
          </p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([mockPdfContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flashStatus("📋 Storyboard PDF Exported! Opening HTML layout browser print stream.");
  };

  // Native MP4 sample download callback
  const downloadSampleMP4 = () => {
    const link = document.createElement('a');
    link.href = activeVideoUrl;
    link.download = `${activeTitle.replace(/\.[^/.]+$/, "")}_4K_HDR.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flashStatus("📥 Downloaded processed 4K MP4 clip to storage!");
  };

  // Write exported record securely to Firebase database
  const saveToSecureCloud = async () => {
    if (!user) return;
    const expId = 'export-' + Math.random().toString(36).substr(2, 9);
    const path = `exports/${expId}`;
    try {
      await setDoc(doc(db, 'exports', expId), {
        id: expId,
        title: activeTitle || 'AI-Video-Creator.mp4',
        prompt: lastAiPrompt || 'Text generated script layout',
        videoUrl: activeVideoUrl,
        duration: `${totalTime}s`,
        posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
        userId: user.uid,
        createdAt: serverTimestamp() 
      });
      fetchExports(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Launch Social Media sharing simulator
  const handlePublishSocialPost = () => {
    setIsPublishingShare(true);
    setShareSuccessNotification(false);

    setTimeout(() => {
      setIsPublishingShare(false);
      setShareSuccessNotification(true);
      flashStatus(`🎉 Successfully shared to Live ${sharingPlatform.toUpperCase()} profile!`);
    }, 2500);
  };

  // Styling for specific LUT filters
  const getSimFilterStyle = () => {
    let result = '';
    const adj = `brightness(${100 + appliedFilters.exposure + (teethWhitening / 10)}%) contrast(${100 + appliedFilters.contrast + (eyeEnlarger / 8)}%) saturate(${100 + appliedFilters.saturation}%)`;
    const smoothBlur = skinSmoothness > 0 ? ` blur(${(skinSmoothness / 100) * 0.3}px)` : '';
    
    switch (activeLut) {
      case 'lut-cyber':
        result = 'contrast(135%) saturate(175%) hue-rotate(-20deg) brightness(105%) filter drop-shadow(0 0 15px rgba(124,58,237,0.35))';
        break;
      case 'lut-teal':
        result = 'contrast(122%) saturate(140%) sepia(18%) saturate(145%) hue-rotate(6deg)';
        break;
      case 'lut-retro':
        result = 'contrast(90%) saturate(75%) sepia(40%) brightness(104%)';
        break;
      case 'lut-matrix':
        result = 'hue-rotate(55deg) saturate(120%) contrast(135%) brightness(95%)';
        break;
      case 'lut-golden':
        result = 'sepia(25%) saturate(150%) hue-rotate(15deg) brightness(103%)';
        break;
      case 'lut-pastel':
        result = 'brightness(108%) contrast(92%) saturate(115%) sepia(6%)';
        break;
      case 'lut-none':
      default:
        result = 'none';
        break;
    }
    const filterStr = result === 'none' ? adj : `${result} ${adj}`;
    return { filter: `${filterStr}${smoothBlur}` };
  };

  const getCaptionClass = () => {
    switch (activeCaptionStyle) {
      case 'gradient-pink':
        return 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-transparent bg-clip-text font-black tracking-tighter drop-shadow-[0_2px_12px_rgba(244,63,94,0.65)]';
      case 'glow-yellow':
        return 'text-yellow-300 font-extrabold uppercase drop-shadow-[0_0_12px_rgba(253,224,71,0.85)] border-b-2 border-yellow-300 px-2 py-0.5 bg-zinc-950/80';
      case 'highlight-cyan':
        return 'bg-cyan-400 text-black px-3 py-1 font-mono font-black italic tracking-wide uppercase shadow-[0_0_15px_rgba(34,211,238,0.6)]';
      case 'cyber-green':
        return 'text-emerald-400 font-black tracking-widest font-mono uppercase bg-black/85 p-2 border border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]';
      case 'white':
      default:
        return 'text-white font-semibold tracking-tight text-center bg-zinc-950/60 px-3 py-1 rounded backdrop-blur-md border border-white/5';
    }
  };

  return (
    <div className="flex flex-col xl:flex-row items-stretch justify-center gap-8 w-full max-w-7xl mx-auto p-1 text-zinc-100">
      
      {/* LEFT COLUMN: Hardware Smartphone Simulator Chassis */}
      <div className="relative shrink-0 mx-auto xl:mx-0">
        
        {/* Outer futuristic halos */}
        <div className="absolute -inset-10 bg-gradient-to-tr from-purple-600/30 via-indigo-600/10 to-cyan-500/20 rounded-[64px] blur-3xl opacity-80 animate-pulse pointer-events-none"></div>
        <div className="absolute top-1/4 -right-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Curved Device Frame wrapper */}
        <div className="relative w-[375px] h-[785px] rounded-[54px] border-[12px] border-[#1c1c22] bg-[#09090b] shadow-[0_0_80px_rgba(0,0,0,0.92),_0_0_40px_rgba(139,92,246,0.18)] overflow-hidden flex flex-col ring-2 ring-white/10 select-none">
          
          {/* Dynamic Island Notch */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3.5 ring-1 ring-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse"></div>
            <div className="w-14 h-1 bg-zinc-900 rounded-full"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
          </div>

          {/* Device hardware signal line */}
          <div className="h-11 px-6 pt-5 flex items-center justify-between text-[11px] text-zinc-400 font-medium z-40 bg-[#09090b] relative">
            <span className="font-sans font-bold text-zinc-200">09:41</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-mono text-[9px] tracking-widest text-[#a78bfa] font-black">5G-AI</span>
              <Battery className="w-4 h-4 text-zinc-300" />
            </div>
          </div>

          {/* SIMULATOR SCREEN VIEWPORT CONTAINER */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-[#060608]">
            
            {/* Real-time status notifications */}
            <AnimatePresence>
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.92 }}
                  className="absolute top-1.5 inset-x-3 z-50 bg-gradient-to-r from-purple-900/90 via-indigo-950/90 to-black/90 border border-purple-500/30 rounded-xl p-2 px-3 shadow-xl backdrop-blur-xl text-[10px] text-zinc-200 font-sans text-left flex items-start gap-2"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5 animate-spin" />
                  <p className="leading-snug flex-1">{statusMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {screen === 'home' ? (
                
                /* ============================================================== */
                /* IPHONE HOME SCREEN LAYOUT                                      */
                /* ============================================================== */
                <motion.div 
                  key="home-screen"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  
                  {/* Top Header Row with Authentication State */}
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/40 relative">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 p-[1px] flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                          {user ? (
                            <img src={user.photoURL || undefined} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-4 h-4 text-violet-400" />
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[7.5px] font-black tracking-widest text-[#a855f7] block uppercase leading-none">CREATOR CORE</span>
                        <span className="text-xs font-black text-zinc-200 mt-0.5 block truncate max-w-[130px]">
                          {user ? user.displayName : 'Guest Editor'}
                        </span>
                      </div>
                    </div>

                    {user ? (
                      <button 
                        onClick={handleAuthSignOut}
                        className="p-1 px-2 text-[9px] font-extrabold text-rose-400/90 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/10 rounded-lg transition"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <button 
                        onClick={handleAuthSignIn}
                        className="px-2.5 py-1 text-[9.5px] font-black tracking-wide text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow hover:opacity-90 transition"
                      >
                        Connect Cloud
                      </button>
                    )}
                  </div>

                  {/* 📂 HOME TAB VIEWER */}
                  <div className="flex-1 overflow-y-auto no-scrollbar pb-14 p-4 space-y-4">
                    
                    {bottomHomeNavTab === 'studio' && (
                      <div className="space-y-4">
                        
                        {/* Core AI Smart Editor Systems (User Specified Feature) */}
                        <div className="bg-gradient-to-b from-[#130f24] to-[#040406] border border-violet-500/20 rounded-3xl p-4.5 space-y-4 relative overflow-hidden shadow-2xl">
                          <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl"></div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/35 flex items-center justify-center shrink-0">
                              <Wand2 className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                                AI Smart Editor
                                <span className="text-[7.5px] bg-violet-500/20 text-[#c084fc] px-1.5 py-0.2 rounded-full font-bold">ACTIVE</span>
                              </h3>
                              <p className="text-[8px] text-zinc-500 font-sans mt-0.5">Instant automated scene slicing & timing clips matching raw footage</p>
                            </div>
                          </div>

                          {/* Quick visual specs */}
                          <div className="grid grid-cols-3 gap-1.5 bg-black/40 rounded-xl p-2.5 border border-white/5 text-center text-[10px]">
                            <div className="p-1">
                              <span className="text-[11px] font-black text-violet-300 block">Detect</span>
                              <span className="text-[7.5px] text-zinc-650 font-mono">Scene Scan</span>
                            </div>
                            <div className="p-1 border-x border-white/5">
                              <span className="text-[11px] font-black text-[#a5f3fc] block">Auto Cut</span>
                              <span className="text-[7.5px] text-zinc-650 font-mono">1-Tap Beats</span>
                            </div>
                            <div className="p-1">
                              <span className="text-[11px] font-black text-[#fbcfe8] block">Highlights</span>
                              <span className="text-[7.5px] text-zinc-650 font-mono">Best Shards</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setScreen('editor');
                              handleAutoEdit();
                            }}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:opacity-95 active:scale-98 transition relative cursor-pointer"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-1.5">
                              <Sparkles className="w-4 h-4 fill-white text-yellow-300" />
                              Auto Edit with AI
                            </span>
                          </button>
                        </div>

                        {/* CORE AI Text-To-Video System */}
                        <div className="bg-gradient-to-b from-[#0e1624] to-[#040406] border border-cyan-500/20 rounded-3xl p-4.5 space-y-3.5 relative overflow-hidden shadow-2xl">
                          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-cyan-600/10 rounded-full blur-3xl"></div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                              <Film className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="text-xs font-black uppercase text-white tracking-wider">AI Text-to-Video</h3>
                              <p className="text-[8px] text-zinc-500 font-sans mt-0.5">Generates cinema-quality reels matching prompt keywords</p>
                            </div>
                          </div>

                          <div className="relative">
                            <textarea
                              value={textVideoPrompt}
                              onChange={(e) => setTextVideoPrompt(e.target.value)}
                              placeholder="Describe your video idea (e.g. Cyber racer drifting in rainy neon streets, or vintage 90s film aesthetic)..."
                              className="w-full h-16 bg-zinc-950/80 text-zinc-200 placeholder-zinc-600 border border-zinc-800 focus:border-cyan-500/40 rounded-xl p-2.5 text-[10px] resize-none outline-none focus:ring-1 focus:ring-cyan-500/10 transition-all font-sans leading-normal"
                            />
                            {textVideoPrompt && (
                              <button 
                                onClick={() => setTextVideoPrompt('')}
                                className="absolute right-2 top-2 text-zinc-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={handleTextToVideoGenerate}
                            disabled={generatingVideo}
                            className="w-full py-3 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 text-black font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:opacity-95 active:scale-98 transition relative cursor-pointer"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-1.5 text-black font-black">
                              {generatingVideo ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                                  Prompting AI...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 fill-black" />
                                  Generate Video
                                </>
                              )}
                            </span>
                          </button>
                        </div>

                        {/* 📂 FOLDER UPLOADER FOR CUSTOM USER CLIPS */}
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setDragOverActive(true); }}
                          onDragLeave={() => setDragOverActive(false)}
                          onDrop={handleFileDrop}
                          className={`bg-zinc-900/35 border-2 border-dashed rounded-3xl p-4 text-center transition duration-300 relative ${
                            dragOverActive ? 'border-purple-500 bg-purple-950/10' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleUserFileChange}
                            accept="video/*,audio/*"
                            className="hidden" 
                          />
                          
                          <div className="flex flex-col items-center space-y-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-10 h-10 rounded-full bg-zinc-950/60 flex items-center justify-center text-zinc-400 border border-white/5 shadow-md">
                              <UploadCloud className="w-5 h-5 text-indigo-400 animate-pulse" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-zinc-300 block">Upload Creator Clip</span>
                              <span className="text-[8px] text-zinc-650 block leading-tight font-sans">Supports raw Video formats or Audio MP3 files to extract</span>
                            </div>
                          </div>

                          {/* Render Uploaded Clips and Extraction Tool shortcuts */}
                          {uploadedUserClips.length > 0 && (
                            <div className="mt-3.5 pt-3.5 border-t border-white/5 text-left space-y-2">
                              <span className="text-[8px] font-black uppercase text-[#a78bfa] tracking-wider block">Uploaded Clip Bank:</span>
                              <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                                {uploadedUserClips.map((clip, idx) => (
                                  <div key={idx} className="p-2 rounded-xl bg-zinc-950/50 border border-white/5 flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-2 truncate">
                                      {clip.type === 'video' ? (
                                        <Film className="w-3.5 h-3.5 text-cyan-400" />
                                      ) : (
                                        <Music className="w-3.5 h-3.5 text-rose-400" />
                                      )}
                                      <div className="truncate text-left">
                                        <span className="text-[9.5px] font-semibold text-zinc-300 block truncate leading-none">{clip.name}</span>
                                        <span className="text-[7.5px] text-zinc-550 block mt-0.5 font-mono">{clip.size} &bull; {clip.type.toUpperCase()}</span>
                                      </div>
                                    </div>

                                    {/* Extraction / loading button */}
                                    <div className="flex gap-1">
                                      {clip.type === 'video' ? (
                                        <button
                                          onClick={() => handleExtractAudioTrack(clip.name)}
                                          className="p-1 px-1.5 text-[7px] font-extrabold uppercase bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 rounded-md hover:bg-cyan-950/60"
                                        >
                                          Extract Audio 🎵
                                        </button>
                                      ) : null}
                                      <button
                                        onClick={() => {
                                          setActiveVideoUrl(clip.previewUrl);
                                          setActiveTitle(clip.name);
                                          setScreen('editor');
                                          flashStatus(`📂 Placed original clip "${clip.name}" inside Workspace!`);
                                        }}
                                        className="p-1 px-1.5 text-[7px] font-semibold uppercase bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md"
                                      >
                                        Use
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {bottomHomeNavTab === 'templates' && (
                      <div className="space-y-3.5">
                        <div className="flex space-y-1.5 flex-col text-left">
                          <h3 className="text-xs font-black uppercase text-[#cbd5e1] tracking-wider flex items-center gap-1">
                            <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                            4,008 Video Templates Hub
                          </h3>
                          <p className="text-[8px] font-sans text-zinc-500">Filtered from high-speed Content Delivery Networks</p>
                        </div>

                        {/* Search and filtering */}
                        <div className="space-y-2">
                          <div className="relative">
                            <input 
                              type="text"
                              value={templateSearchQuery}
                              onChange={(e) => setTemplateSearchQuery(e.target.value)}
                              placeholder="Search templates database..."
                              className="w-full bg-[#0d0d10] text-[9.5px] p-2 pl-7.5 border border-zinc-850 focus:border-purple-500/40 rounded-xl outline-none"
                            />
                            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                            {templateSearchQuery && (
                              <button onClick={() => setTemplateSearchQuery('')} className="absolute right-2.5 top-2.5 text-zinc-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Quick Category chips filter */}
                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                            {['All', 'Velocity', 'Cyber Rave', 'Retro Film', 'Pastel Vlog', 'Beats & Drops', 'Luxury Aesthetics'].map((cat) => (
                              <button
                                key={cat}
                                onClick={() => setSelectedTemplateCategory(cat)}
                                className={`px-2 py-1 rounded-full text-[8px] font-black shrink-0 transition ${
                                  selectedTemplateCategory === cat 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-zinc-955 border border-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {cat.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Grid list display */}
                        <div className="grid grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1 no-scrollbar">
                          {getFilteredTemplates().map((tmpl) => (
                            <div 
                              key={tmpl.id}
                              className="bg-[#0b0c0f] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition duration-300 text-left"
                            >
                              <div className="relative h-20 bg-zinc-950">
                                <img src={tmpl.poster} alt={tmpl.title} className="w-full h-full object-cover opacity-75" />
                                <span className="absolute top-1 left-1 bg-black/60 backdrop-blur px-1 py-0.2 rounded text-[7px] font-black text-cyan-400 font-mono tracking-wider">
                                  {tmpl.tag}
                                </span>
                                <span className="absolute bottom-1 right-1 bg-zinc-950/80 px-1 text-[7px] rounded font-mono text-zinc-300">
                                  {tmpl.duration}
                                </span>
                              </div>
                              <div className="p-2 space-y-1.5">
                                <h4 className="text-[9px] font-extrabold text-zinc-200 truncate leading-tight">{tmpl.title}</h4>
                                <div className="flex items-center justify-between text-[7px] text-zinc-550">
                                  <span>🚀 {tmpl.category}</span>
                                  <span>🔥 {tmpl.useCount}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveVideoUrl(tmpl.videoUrl);
                                    setActiveTitle(tmpl.title);
                                    setScreen('editor');
                                    flashStatus(`⚡ Matched Template "${tmpl.title}" to target workflow!`);
                                  }}
                                  className="w-full py-1 text-[8px] uppercase font-black tracking-wider text-black bg-gradient-to-r from-purple-400 to-indigo-400 rounded-lg shadow-sm hover:opacity-95 active:scale-95 transition"
                                >
                                  Use template
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination mimicking massive 4,000 pool */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <button
                            disabled={templateCatalogPageNum <= 1}
                            onClick={() => setTemplateCatalogPageNum(prev => prev - 1)}
                            className="text-[8px] bg-zinc-900 border border-white/5 p-1 px-2.5 rounded hover:text-white disabled:opacity-40"
                          >
                            &larr; Prev
                          </button>
                          
                          <span className="text-[8.5px] font-mono text-zinc-550">
                            Page <strong className="text-zinc-300">{templateCatalogPageNum}</strong> of 334 (4k files)
                          </span>

                          <button
                            disabled={templateCatalogPageNum >= 334}
                            onClick={() => setTemplateCatalogPageNum(prev => prev + 1)}
                            className="text-[8px] bg-zinc-900 border border-white/5 p-1 px-2.5 rounded hover:text-white disabled:opacity-40"
                          >
                            Next &rarr;
                          </button>
                        </div>

                        <form onSubmit={handleJumpToPage} className="flex items-center gap-1 justify-center">
                          <span className="text-[7.5px] text-zinc-500 font-bold uppercase font-mono">Jump to Page:</span>
                          <input 
                            type="text" 
                            size={3}
                            value={jumpPageInputVal}
                            onChange={(e) => setJumpPageInputVal(e.target.value)}
                            placeholder="120"
                            className="bg-[#0b0c0f] border border-white/5 text-[8.5px] p-0.5 rounded text-center w-8 text-white font-mono"
                          />
                          <button type="submit" className="text-[8px] uppercase font-black text-purple-400 bg-white/5 p-0.5 px-1.5 rounded">Go</button>
                        </form>

                      </div>
                    )}

                    {bottomHomeNavTab === 'library' && (
                      <div className="space-y-4">
                        
                        {/* Cloud backups */}
                        <div className="space-y-2 bg-zinc-950/45 p-3.5 border border-white/5 rounded-2xl text-left relative">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] text-zinc-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                              🔒 Secure Cloud Backup Exports
                            </span>
                            {user && (
                              <button 
                                onClick={() => fetchExports(user.uid)}
                                className="text-[8px] text-zinc-500 hover:text-indigo-400 flex items-center gap-0.5"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Sync</span>
                              </button>
                            )}
                          </div>

                          {!user ? (
                            <div className="py-4.5 text-center bg-black/25 rounded-2xl border border-dashed border-white/5 text-zinc-620 text-[9px] px-3 space-y-1.5">
                              <p className="leading-normal text-zinc-500">
                                Guest Mode active. Authenticate with Google to see yours and keep your generated videos persisted securely inside Firestore database nodes.
                              </p>
                              <button 
                                onClick={handleAuthSignIn}
                                className="px-2.5 py-1 text-[8.5px] rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500/20 transition cursor-pointer"
                              >
                                Clear Sync Secure Auth
                              </button>
                            </div>
                          ) : loadingCloud ? (
                            <div className="py-4.5 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                              <span>Syncing secure indexes...</span>
                            </div>
                          ) : cloudExports.length === 0 ? (
                            <div className="py-4 text-center bg-black/10 rounded-xl text-zinc-550 text-[9.5px]">
                              No cloud exports securely backed up yet. Try exporting a video to sync!
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar">
                              {cloudExports.map((item) => (
                                <div 
                                  key={item.id}
                                  className="p-2 rounded-xl bg-zinc-900/30 hover:bg-zinc-950 border border-white/5 flex items-center justify-between gap-1.5"
                                >
                                  <div 
                                    onClick={() => {
                                      setActiveVideoUrl(item.videoUrl);
                                      setActiveTitle(item.title);
                                      setLastAiPrompt(item.prompt);
                                      setScreen('editor');
                                      flashStatus(`📂 Loaded Cloud Backup: ${item.title}`);
                                    }}
                                    className="flex items-center gap-2 truncate cursor-pointer flex-1"
                                  >
                                    <div className="w-9 h-8 bg-zinc-950 rounded border border-white/10 overflow-hidden relative shrink-0">
                                      <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80" alt="cap" className="w-full h-full object-cover opacity-60" />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Play className="w-2.5 h-2.5 text-white fill-white opacity-90" />
                                      </div>
                                    </div>
                                    <div className="truncate text-left">
                                      <span className="text-[10px] font-bold text-zinc-200 block truncate leading-tight">{item.title}</span>
                                      <span className="text-[8px] text-indigo-400/90 block truncate leading-none mt-0.5 font-mono">Prompt: "{item.prompt}"</span>
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => handleDeleteExport(item.id)}
                                    className="p-1 px-1.5 rounded-lg hover:bg-rose-950/40 text-rose-500 hover:text-rose-400 transition shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>

                        {/* Recent project lists */}
                        <div className="space-y-2 text-left">
                          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest pl-0.5 block">
                            Local Recent Projects (Cache)
                          </span>

                          <div className="space-y-2">
                            {RECENT_PROJECTS.map((proj) => (
                              <div 
                                key={proj.id}
                                onClick={() => {
                                  setActiveVideoUrl(proj.videoUrl);
                                  setActiveTitle(proj.title);
                                  setScreen('editor');
                                  flashStatus(`📁 Opened Project: ${proj.title}`);
                                }}
                                className="p-2 rounded-xl bg-zinc-900/30 hover:bg-zinc-900 border border-white/5 transition flex items-center justify-between cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <div className="w-9 h-8 bg-zinc-950 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                    <img src={proj.poster} alt={proj.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                                  </div>
                                  <div className="truncate text-left">
                                    <span className="text-[9.5px] font-extrabold text-zinc-300 block truncate group-hover:text-indigo-400 transition">{proj.title}</span>
                                    <span className="text-[8px] text-zinc-500 block mt-0.5">{proj.duration} &bull; {proj.date}</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-200 transition shrink-0 transform group-hover:translate-x-0.5" />
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Curated Frosted Glass Mobile Bottom Navigation Hub */}
                  <div className="absolute bottom-0 inset-x-0 h-14 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-40">
                    <button
                      onClick={() => setBottomHomeNavTab('studio')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                        bottomHomeNavTab === 'studio' ? 'text-[#c084fc]' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Wand2 className="w-4.5 h-4.5" />
                      <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">Studio</span>
                    </button>

                    <button
                      onClick={() => setBottomHomeNavTab('templates')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                        bottomHomeNavTab === 'templates' ? 'text-[#c084fc]' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Grid className="w-4.5 h-4.5" />
                      <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">4K Templates</span>
                    </button>

                    <button
                      onClick={() => setBottomHomeNavTab('library')}
                      className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                        bottomHomeNavTab === 'library' ? 'text-[#c084fc]' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Database className="w-4.5 h-4.5" />
                      <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter">My Files</span>
                    </button>
                  </div>

                </motion.div>
              ) : (
                
                /* ============================================================== */
                /* IPHONE EDITOR SCREEN LAYOUT                                    */
                /* ============================================================== */
                <motion.div 
                  key="editor-screen"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex-1 flex flex-col justify-stretch overflow-hidden relative"
                >
                  
                  {/* Editor Top Navigation Line */}
                  <div className="h-10 px-3 border-b border-white/5 flex items-center justify-between text-zinc-400 bg-zinc-950/60 backdrop-blur">
                    <button 
                      onClick={() => setScreen('home')}
                      className="px-2 py-1 text-[8px] font-black uppercase text-zinc-400 bg-white/5 border border-white/10 rounded-lg transition"
                    >
                      &larr; Exit
                    </button>
                    
                    <span className="text-[9px] font-bold text-zinc-200 truncate max-w-[120px] font-mono">
                      {activeTitle}
                    </span>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => setIsShareModalOpen(true)}
                        className="px-2 py-1 text-[8px] font-black rounded-lg bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-mono flex items-center gap-0.5"
                      >
                        <Share2 className="w-2.5 h-2.5" />
                        <span>SHARE</span>
                      </button>
                      
                      <button 
                        onClick={() => setIsExporting(true)}
                        className="px-2 py-1 text-[8.5px] font-black rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono flex items-center gap-0.5 shadow-md shadow-indigo-600/10 transition cursor-pointer"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>EXPORT</span>
                      </button>
                    </div>
                  </div>

                  {/* VIDEO STAGE VIEWER CONTAINER */}
                  <div className="relative aspect-video bg-zinc-950 w-full overflow-hidden flex items-center justify-center border-b border-white/5 select-none">
                    
                    <video 
                      ref={videoRef}
                      src={activeVideoUrl}
                      autoPlay={isPlaying}
                      muted
                      loop
                      playsInline
                      style={getSimFilterStyle()}
                      className="w-full h-full object-cover relative"
                    />

                    {/* Dynamic transition strobe flash effect */}
                    <AnimatePresence>
                      {transitionFlash && (
                        <motion.div 
                          initial={{ opacity: 0.95 }}
                          animate={{ opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="absolute inset-0 bg-white/90 z-40 pointer-events-none flex items-center justify-center font-display"
                        >
                          <span className="text-black font-mono text-[8px] font-black uppercase tracking-widest bg-white/95 px-2 py-1 rounded shadow-xl border border-black/5">
                            ⚡ {activeTransition.toUpperCase()} FX ACTIVATED
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Timeline Live Subtitle/Caption Overlay */}
                    {activeCaptions && (
                      <div className="absolute inset-x-4 bottom-5 pointer-events-none flex items-center justify-center text-center z-35">
                        <span className={`text-[10px] text-center font-bold font-display shadow-lg rounded leading-normal max-w-[85%] px-2 py-0.5 ${getCaptionClass()}`}>
                          {activeCaptions}
                        </span>
                      </div>
                    )}

                    <span className="absolute top-2 left-2 bg-black/60 text-[#a855f7] text-[7.5px] tracking-widest font-black uppercase px-1.5 py-0.2 rounded font-mono border border-purple-500/20">
                      LIVE PREVIEW HDR
                    </span>

                    {/* Bouncing audio wave equalizer display */}
                    {audioSpectrumActive && (
                      <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-5 bg-black/45 px-1 py-0.5 rounded border border-white/5">
                        <div className="w-[1.5px] bg-indigo-400 animate-[bounce_0.6s_infinite_0.1s]" style={{ height: '70%' }}></div>
                        <div className="w-[1.5px] bg-cyan-400 animate-[bounce_0.4s_infinite_0.3s]" style={{ height: '95%' }}></div>
                        <div className="w-[1.5px] bg-indigo-400 animate-[bounce_0.8s_infinite]" style={{ height: '40%' }}></div>
                        <div className="w-[1.5px] bg-cyan-300 animate-[bounce_0.5s_infinite_0.2s]" style={{ height: '80%' }}></div>
                      </div>
                    )}

                    {!isPlaying && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center" onClick={() => setIsPlaying(true)}>
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white backdrop-blur-sm cursor-pointer hover:bg-white/20 transition">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Playback time controls & Mobile precision zoom */}
                  <div className="px-3 py-1.5 flex items-center justify-between text-[9px] text-zinc-500 font-mono bg-[#09090b] border-t border-white/5 select-none">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="text-zinc-300 hover:text-white transition cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-2.5 h-2.5 fill-white text-white" /> : <Play className="w-2.5 h-2.5 fill-white text-white" />}
                      </button>
                      
                      <span>02:{playbackTime.toFixed(1).padStart(4, '0')}</span>
                    </div>

                    {/* Precision Mobile Timeline Zoom Slider */}
                    <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                      <span className="text-[7.5px] text-zinc-500 uppercase tracking-wider font-bold">🔍 ZOOM</span>
                      <input 
                        type="range" 
                        min="1.0" 
                        max="4.0" 
                        step="0.5" 
                        value={mobZoom} 
                        onChange={(e) => setMobZoom(parseFloat(e.target.value))} 
                        className="w-10 accent-purple-500 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                        title="Simulated timeline horizontal zoom scale slider"
                      />
                      <span className="text-[7.5px] text-[#a855f7] font-extrabold w-4 text-right font-mono">
                        {mobZoom.toFixed(1)}x
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span>02:{totalTime.toFixed(1).padStart(4, '0')}</span>
                      <button 
                        onClick={() => { setPlaybackTime(0); setIsPlaying(true); }}
                        className="text-zinc-455 hover:text-white transition cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-zinc-500 hover:text-zinc-300" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontally scrollable advanced timeline editing tab sheets */}
                  <div className="flex bg-[#0d0d10] border-y border-white/5 overflow-x-auto no-scrollbar whitespace-nowrap px-1 text-[8px] font-black uppercase scroll-smooth select-none">
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'controls' ? 'none' : 'controls')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'controls' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      🎛️ Controls
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'audio' ? 'none' : 'audio')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'audio' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      🎵 Music
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'voice' ? 'none' : 'voice')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'voice' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      🎙️ AI Voice
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'extract' ? 'none' : 'extract')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'extract' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      ✂️ Extract
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'luts' ? 'none' : 'luts')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'luts' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      🎨 Filters
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'trans' ? 'none' : 'trans')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'trans' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      ✨ FX Trans
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'retouch' ? 'none' : 'retouch')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'retouch' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      👤 Retouch
                    </button>
                    <button 
                      onClick={() => setCurrentToolTab(currentToolTab === 'text' ? 'none' : 'text')} 
                      className={`py-2 px-3 transition shrink-0 ${currentToolTab === 'text' ? 'text-purple-400 border-b border-purple-500 font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      📝 Captions
                    </button>
                  </div>

                  {/* ACTIVE TAB CONTROL BOARD */}
                  <div className="bg-zinc-950/90 p-3 select-none flex-1 overflow-y-auto no-scrollbar max-h-[178px] text-left">
                    
                    {currentToolTab === 'controls' && (
                      <div className="space-y-2.5 font-sans relative">
                        {/* Selected Track Pill badges to show active layer selection */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5 gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-[#0a0a0d] px-1.5 py-0.5 rounded-lg border border-white/5">
                            <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-bold">Layer:</span>
                            {(['video', 'audio', 'subtitles'] as const).map((trackType) => (
                              <button
                                key={trackType}
                                onClick={() => {
                                  setSelectedTrack(trackType);
                                  flashStatus(`Switched editing layer context to: ${trackType.toUpperCase()}`);
                                }}
                                className={`text-[7.5px] font-black uppercase px-2 py-0.5 rounded transition ${
                                  selectedTrack === trackType 
                                    ? 'bg-purple-900/45 text-purple-300 border border-purple-500/30' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {trackType}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setWorkspaceLayout(workspaceLayout === 'compact' ? 'pro' : 'compact');
                                flashStatus(`Switched workspace preset to: ${workspaceLayout === 'compact' ? 'PRO VIEW' : 'COMPACT VIEW'}`);
                              }}
                              className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[7.5px] font-extrabold text-zinc-400 hover:border-purple-500/20 transition"
                            >
                              Workspace: <span className="text-[#a855f7] font-black uppercase">{workspaceLayout}</span>
                            </button>
                          </div>
                        </div>

                        {/* SUB TOOLBAR ROW */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5 border-b border-white/5 whitespace-nowrap">
                          {[
                            { id: 'speed', label: '🚀 Speed multiplier' },
                            { id: 'color', label: '🎨 Hue & Chroma' },
                            { id: 'overlay', label: '🎭 Blend modes' },
                            { id: 'advanced', label: '🎛️ Keyframes & Blur' }
                          ].map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => setActiveControlSubTab(sub.id as any)}
                              className={`text-[8px] font-bold px-2 py-1 rounded-md shrink-0 border transition ${
                                activeControlSubTab === sub.id
                                  ? 'bg-purple-950/40 border-purple-500/20 text-purple-300'
                                  : 'bg-[#18181b] border-transparent text-zinc-450 hover:text-zinc-200'
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}

                          <button
                            onClick={() => {
                              setShowMoreToolsPanel(true);
                              flashStatus("Expanded advanced tools deck!");
                            }}
                            className="bg-purple-650 hover:bg-purple-500 text-white font-extrabold text-[8px] px-2.5 py-1 rounded-md shrink-0 transition"
                          >
                            More ⋯
                          </button>
                        </div>

                        {/* SUB PANEL VIEW: SPEED */}
                        {activeControlSubTab === 'speed' && (
                          <div className="space-y-1 bg-zinc-950/40 rounded p-1">
                            {selectedTrack === 'video' ? (
                              <>
                                <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500">
                                  <span>Dynamic speed curve velocity ramp:</span>
                                  <span className="text-purple-400 font-extrabold text-[7.5px]">{activeCurveSpeed === 'normal' ? '1.0x (Standard)' : activeCurveSpeed === 'montage' ? '2.5x Montage Ramp' : activeCurveSpeed === 'bullet' ? '0.2s Bullet Time slow-mo' : '4.0x Jump Cut ramp'}</span>
                                </div>
                                <div className="flex gap-1 items-center justify-between">
                                  {[
                                    { id: 'normal', name: 'Standard 1x' },
                                    { id: 'montage', name: 'Montage Ramp' },
                                    { id: 'bullet', name: 'Bullet Time' },
                                    { id: 'jump', name: 'Jump Cut Ramp' }
                                  ].map((curv) => (
                                    <button
                                      key={curv.id}
                                      onClick={() => {
                                        setActiveCurveSpeed(curv.id);
                                        flashStatus(`Active curve speed set: ${curv.name}`);
                                      }}
                                      className={`flex-1 text-[7.5px] py-1 px-1 rounded font-bold transition uppercase ${
                                        activeCurveSpeed === curv.id
                                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/20'
                                          : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-transparent'
                                      }`}
                                    >
                                      {curv.name}
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-[7.5px] text-zinc-500 py-1 font-mono text-center">
                                * Speed parameters can only be altered on Video active layer.
                              </div>
                            )}
                          </div>
                        )}

                        {/* SUB PANEL VIEW: COLOR ADJUSTMENTS */}
                        {activeControlSubTab === 'color' && (
                          <div className="space-y-1.5 bg-zinc-950/40 rounded p-1 text-[8px]">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[7px] text-zinc-500 uppercase font-bold mb-0.5">Exposure: {appliedFilters.exposure > 0 ? `+${appliedFilters.exposure}` : appliedFilters.exposure}%</label>
                                <input
                                  type="range"
                                  min="-50"
                                  max="50"
                                  value={appliedFilters.exposure}
                                  onChange={(e) => setAppliedFilters(prev => ({ ...prev, exposure: parseInt(e.target.value) }))}
                                  className="w-full accent-purple-500 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                                />
                              </div>
                              <div>
                                <label className="block text-[7px] text-zinc-500 uppercase font-bold mb-0.5">Contrast: {appliedFilters.contrast}%</label>
                                <input
                                  type="range"
                                  min="-50"
                                  max="50"
                                  value={appliedFilters.contrast}
                                  onChange={(e) => setAppliedFilters(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                                  className="w-full accent-purple-500 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                                />
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-[7.5px] text-zinc-500 border-t border-white/5 pt-1">
                              <span>Chroma Key Overlay cutout:</span>
                              <button
                                onClick={() => {
                                  setChromaKeyEnabled(!chromaKeyEnabled);
                                  flashStatus(chromaKeyEnabled ? "Deactivated background cutout" : "Activated background cutout!");
                                }}
                                className={`text-[7px] font-black uppercase px-2 py-0.5 rounded transition ${
                                  chromaKeyEnabled 
                                    ? 'bg-emerald-900 border border-emerald-500 text-emerald-300' 
                                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {chromaKeyEnabled ? '🟢 chroma key on' : '🔴 chroma key off'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* SUB PANEL VIEW: BLEND MODES */}
                        {activeControlSubTab === 'overlay' && (
                          <div className="space-y-1 bg-zinc-950/40 rounded p-1 text-[8px]">
                            <div className="flex items-center justify-between text-[7px] text-zinc-500 mb-0.5">
                              <span>Select rendering blend formula:</span>
                              <span className="text-purple-400 font-extrabold uppercase">{activeBlendMode} mode</span>
                            </div>
                            <div className="flex gap-1">
                              {['normal', 'overlay', 'screen', 'multiply'].map((bMode) => (
                                <button
                                  key={bMode}
                                  onClick={() => {
                                    setActiveBlendMode(bMode);
                                    flashStatus(`Selected layer rendering properties: ${bMode.toUpperCase()}`);
                                  }}
                                  className={`flex-1 text-[7px] py-1 rounded font-bold uppercase transition ${
                                    activeBlendMode === bMode
                                      ? 'bg-purple-900 border border-purple-500/20 text-purple-300'
                                      : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  {bMode}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SUB PANEL VIEW: KEYFRAMES */}
                        {activeControlSubTab === 'advanced' && (
                          <div className="space-y-1 bg-zinc-950/40 rounded p-1">
                            <div className="flex justify-between items-center text-[8px]">
                              <span className="text-[7.5px] text-zinc-500">Motion Blur: <span className="text-purple-400 font-bold">{motionBlurAmount}px</span></span>
                              <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={motionBlurAmount}
                                  onChange={(e) => setMotionBlurAmount(parseInt(e.target.value))}
                                  className="w-16 accent-indigo-500 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-1 mt-1 text-[8px]">
                              <span className="text-[7.5px] text-zinc-500">Insert Keyframe at {playbackTime.toFixed(1)}s:</span>
                              <button
                                onClick={() => {
                                  if (!timelineKeyframes.includes(parseFloat(playbackTime.toFixed(1)))) {
                                    setTimelineKeyframes([...timelineKeyframes, parseFloat(playbackTime.toFixed(1))].sort());
                                    flashStatus(`Set spatial keyframe lock at ${playbackTime.toFixed(1)}s!`);
                                  } else {
                                    flashStatus("Keyframe anchor is already locked standard at this point.");
                                  }
                                }}
                                className="bg-[#a855f7] hover:bg-purple-500 text-white font-extrabold uppercase text-[7px] px-2 py-0.5 rounded shadow shadow-purple-500/50"
                              >
                                💎 Add Keyframe
                              </button>
                            </div>
                          </div>
                        )}

                        {/* REALTIME COGNITIVE SMART EDITING RECOMMENDATIONS CHIP */}
                        <div className="flex items-start gap-1 bg-[#4c1d95]/10 border border-[#c084fc]/15 p-1 rounded-lg text-[7.5px] tracking-wide leading-tight text-purple-300 mt-1 select-none">
                          <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-black uppercase tracking-wider text-purple-400 mr-1">AI Suggestion:</span>
                            {selectedTrack === 'video' 
                              ? "Velocity 'Bullet Time' ramping will align this video perfectly with the energetic music bass transient drops at 2.5s." 
                              : selectedTrack === 'audio' 
                              ? "Your soundtrack supports high dynamic range beat sync matching. We recommend turning on 'SYNC_WAVE' mode." 
                              : "Neon caption glows look stunning under the active LUT neon adjustments to street glow details."}
                          </div>
                        </div>

                      </div>
                    )}

                    {currentToolTab === 'none' && (
                      <div className="space-y-1.5 font-sans">
                        <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider block">AI Script Suggester logs:</span>
                        <p className="text-[9.5px] text-zinc-400 leading-normal">&bull; Applied automatic velocity timing loops to match transient bass drops.</p>
                        <p className="text-[9.5px] text-zinc-400 leading-normal">&bull; Color balance: applied high dynamic neon adjustments to street glow details.</p>
                        <p className="text-[9.5px] text-zinc-500 leading-normal flex items-center gap-1 font-mono text-[8px]">
                          <Wifi className="w-3 h-3 text-emerald-400 inline" /> Status: 1,024 neural voices synced &bull; Swipe tab bar to view 7 editors.
                        </p>
                      </div>
                    )}

                    {currentToolTab === 'audio' && (
                      <div className="space-y-2.5">
                        <span className="text-[8.5px] font-black uppercase text-[#a855f7] tracking-wider block">Background Sounds Deck:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { name: 'Cyber Synth Bass', rate: '128 BPM' },
                            { name: 'Analogue Tape Hum', rate: 'Mellow' },
                            { name: 'Atmospheric Rise FX', rate: 'Ambient' },
                            { name: 'Drift Club Beat', rate: '140 BPM' }
                          ].map((track, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setAudioSpectrumActive(true);
                                setActiveAudioBeatTrack(track.name);
                                flashStatus(`🎵 Loaded audio loop "${track.name}" synced to main playhead.`);
                              }}
                              className={`p-1.5 rounded-lg text-left border flex flex-col justify-start text-[8.5px] ${
                                activeAudioBeatTrack === track.name 
                                  ? 'bg-purple-950/40 border-[#a855f7] text-[#c084fc]' 
                                  : 'bg-zinc-900/60 border-white/5 text-zinc-300'
                              }`}
                            >
                              <span className="font-bold truncate">{track.name}</span>
                              <span className="text-[7px] text-zinc-550 block font-mono">{track.rate}</span>
                            </button>
                          ))}
                        </div>

                        {/* INTER-TOOL SHORTCUT LINK */}
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550">
                          <span>Sync with transitions?</span>
                          <button 
                            onClick={() => setCurrentToolTab('trans')}
                            className="text-[#a855f7] hover:underline flex items-center gap-0.5 uppercase font-bold"
                          >
                            Go to FX Transitions &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {currentToolTab === 'voice' && (() => {
                      const mobFilteredVoices = queryAIVoices({
                        searchQuery: mobVoiceSearchQuery,
                        region: mobVoiceRegionFilter,
                        gender: mobVoiceGenderFilter,
                        style: mobVoiceStyleFilter
                      });

                      const mobPageSize = 3;
                      const mobMaxPages = Math.max(1, Math.ceil(mobFilteredVoices.length / mobPageSize));
                      const mobCurrentPage = Math.min(mobVoicePageIndex, mobMaxPages - 1);
                      const mobPaginatedVoices = mobFilteredVoices.slice(mobCurrentPage * mobPageSize, (mobCurrentPage + 1) * mobPageSize);
                      const currentSelectedVoiceObj = mobFilteredVoices.find(v => v.id === selectedVoiceProfile) || mobFilteredVoices[0];

                      return (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <span className="text-[8px] font-black uppercase text-[#a855f7] tracking-wider block">
                              AI Voice (1,000+ Voices Indexed)
                            </span>
                            <span className="text-[8px] font-mono text-zinc-500">
                              {mobFilteredVoices.length} Found
                            </span>
                          </div>
                          
                          <textarea
                            value={voiceScriptText}
                            onChange={(e) => setVoiceScriptText(e.target.value)}
                            placeholder="Type scripting narration voiceover text..."
                            className="w-full bg-[#0d0d10] border border-zinc-850 text-[9px] p-1.5 rounded-lg text-white resize-none outline-none focus:border-purple-500/20 leading-tight h-10 font-sans"
                            rows={2}
                          />

                          {/* Search Input Box */}
                          <div className="relative">
                            <Search className="w-2.5 h-2.5 text-zinc-550 absolute left-2 top-2" />
                            <input
                              type="text"
                              value={mobVoiceSearchQuery}
                              onChange={(e) => {
                                setMobVoiceSearchQuery(e.target.value);
                                setMobVoicePageIndex(0);
                              }}
                              placeholder="Search 500+ world languages (e.g. French, Japanese)..."
                              className="w-full bg-[#0d0d10] text-[#cbd5e1] border border-zinc-850 text-[8.5px] pl-6 pr-2 py-1 rounded outline-none placeholder:text-zinc-650"
                            />
                          </div>

                          {/* Compact mobile filter row select controls */}
                          <div className="grid grid-cols-2 gap-1 text-[8px]">
                            <div>
                              <select
                                value={mobVoiceRegionFilter}
                                onChange={(e) => {
                                  setMobVoiceRegionFilter(e.target.value);
                                  setMobVoicePageIndex(0);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-850 text-zinc-300 rounded p-0.5 outline-none font-mono text-[8.5px]"
                              >
                                <option value="All">🌐 All Regions</option>
                                <option value="Americas">🇺🇸 Americas</option>
                                <option value="Europe">🇪🇺 Europe</option>
                                <option value="East Asia">🇯🇵 East Asia</option>
                                <option value="South Asia">🇮🇳 South Asia</option>
                                <option value="Africa">🌍 Africa</option>
                              </select>
                            </div>
                            <div>
                              <select
                                value={mobVoiceGenderFilter}
                                onChange={(e) => {
                                  setMobVoiceGenderFilter(e.target.value);
                                  setMobVoicePageIndex(0);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-850 text-zinc-300 rounded p-0.5 outline-none font-mono text-[8.5px]"
                              >
                                <option value="All">🚻 Genders</option>
                                <option value="Female">♀️ Female</option>
                                <option value="Male">♂️ Male</option>
                                <option value="Non-binary">⚦ Non-binary</option>
                              </select>
                            </div>
                          </div>

                          {/* Paginated Voice Grid List */}
                          <div className="space-y-1">
                            {mobPaginatedVoices.map((v) => {
                              const isSelected = selectedVoiceProfile === v.id;
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => setSelectedVoiceProfile(v.id)}
                                  className={`w-full p-1.5 rounded-lg text-left flex items-center justify-between border text-[8.5px] transition ${
                                    isSelected 
                                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-300' 
                                      : 'bg-zinc-900/60 border-zinc-850 text-zinc-400'
                                  }`}
                                >
                                  <div className="truncate pr-1">
                                    <span className="font-extrabold text-[9px] block text-zinc-100 truncate">{v.name.replace(' 🎙️', '')}</span>
                                    <span className="font-mono text-[7.5px] text-zinc-450">🌐 {v.language} &bull; {v.style.split(' ').slice(1).shift()}</span>
                                  </div>
                                  <span className="text-[7px] shrink-0 font-mono text-emerald-400 bg-emerald-500/5 px-1 py-0.2 border border-emerald-500/10 rounded">
                                    {v.qualityRate.split(' ').shift()}
                                  </span>
                                </button>
                              );
                            })}

                            {mobPaginatedVoices.length === 0 && (
                              <div className="p-2 border border-dashed border-zinc-850 rounded text-center text-[8.5px] text-zinc-600 font-mono">
                                No voices found. Type another language keyword!
                              </div>
                            )}

                            {/* Mini Paging bar */}
                            {mobMaxPages > 1 && (
                              <div className="flex items-center justify-between text-[7.5px] pt-1 font-mono text-zinc-550 select-none">
                                <button
                                  disabled={mobCurrentPage <= 0}
                                  onClick={() => setMobVoicePageIndex(prev => Math.max(0, prev - 1))}
                                  className="text-purple-400 hover:underline disabled:opacity-20 uppercase font-bold"
                                >
                                  &larr; Prev
                                </button>
                                <span>Page {mobCurrentPage + 1} of {mobMaxPages}</span>
                                <button
                                  disabled={mobCurrentPage >= mobMaxPages - 1}
                                  onClick={() => setMobVoicePageIndex(prev => Math.min(mobMaxPages - 1, prev + 1))}
                                  className="text-purple-400 hover:underline disabled:opacity-20 uppercase font-bold"
                                >
                                  Next &rarr;
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleSynthesizeAiVoice}
                            disabled={isSynthesizingVoice || mobFilteredVoices.length === 0}
                            className="w-full py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-md hover:scale-[1.01] transition active:scale-97 cursor-pointer"
                          >
                            {isSynthesizingVoice ? 'Connecting Voice Synth...' : `Synthesize & Sync: ${currentSelectedVoiceObj ? currentSelectedVoiceObj.name.replace(' 🎙️', '') : 'Neural'}`}
                          </button>

                          {/* INTER-TOOL SHORTCUT LINK */}
                          <div className="pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-555 border-t border-white/5">
                            <span>Adjust style captions?</span>
                            <button 
                              onClick={() => setCurrentToolTab('text')}
                              className="text-cyan-400 hover:underline uppercase font-bold"
                            >
                              Subtitle Styles &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {currentToolTab === 'extract' && (
                      <div className="space-y-2.5 text-zinc-300">
                        <span className="text-[8.5px] font-black uppercase text-[#a855f7] tracking-wider block">Dequantize & Video-To-Audio Extraction:</span>
                        
                        <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 space-y-2">
                          <p className="text-[8px] leading-relaxed text-zinc-400 leading-normal">
                            Select any video item from your device gallery. Our AI pipeline immediately isolates and decodes the audio track, outputting a high-fidelity synced waveform.
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExtractAudioTrack('RAW_POV_RIDE.mov')}
                              disabled={isExtractingAudio}
                              className="text-[8px] font-black uppercase bg-purple-950/40 p-1 px-2 border border-purple-500/30 text-purple-300 rounded cursor-pointer"
                            >
                              {isExtractingAudio ? 'Extracting waveform...' : 'De-mux Sound: RAW_POV_RIDE.mov'}
                            </button>
                          </div>
                        </div>

                        {/* INTER-TOOL SHORTCUT LINK */}
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550">
                          <span>Synthesize voice dub notes?</span>
                          <button 
                            onClick={() => setCurrentToolTab('voice')}
                            className="text-[#a855f7] hover:underline flex items-center gap-0.5 uppercase font-bold"
                          >
                            AI Voice Generator &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {currentToolTab === 'luts' && (
                      <div className="space-y-2.5">
                        <span className="text-[8.5px] font-black uppercase text-[#a855f7] tracking-wider block">Grading LUT Lookup Presets:</span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'lut-none', name: 'Original Film' },
                            { id: 'lut-cyber', name: 'Cyber Neon' },
                            { id: 'lut-teal', name: 'Teal & Orange' },
                            { id: 'lut-retro', name: 'Retro VHS' },
                            { id: 'lut-matrix', name: 'Matrix Green' },
                            { id: 'lut-golden', name: 'Sunset Gold' }
                          ].map((lut) => (
                            <button
                              key={lut.id}
                              onClick={() => {
                                setActiveLut(lut.id);
                                flashStatus(`🎨 LUT Color set to ${lut.name}`);
                              }}
                              className={`p-1 text-center text-[8.5px] font-bold rounded border ${
                                activeLut === lut.id 
                                  ? 'bg-[#1e1b4b] border-[#a855f7] text-[#c084fc]' 
                                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {lut.name}
                            </button>
                          ))}
                        </div>

                        {/* INTER-TOOL SHORTCUT LINK */}
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550">
                          <span>Apply face smooth retouching?</span>
                          <button 
                            onClick={() => setCurrentToolTab('retouch')}
                            className="text-purple-400 hover:underline uppercase font-bold"
                          >
                            Retouch Filters &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {currentToolTab === 'trans' && (
                      <div className="space-y-2.5">
                        <span className="text-[8.5px] font-black uppercase text-[#a855f7] tracking-wider block">Cinematic Scene Transitions:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'smooth-dissolve', label: '💧 Smooth Dissolve' },
                            { id: 'cosmic-glitch', label: '👾 Cosmic Glitch' },
                            { id: 'lateral-wipe', label: '➡️ Lateral Wipe' },
                            { id: 'laser-flash', label: '⚡ Laser Flash' }
                          ].map((trans) => (
                            <button
                              key={trans.id}
                              onClick={() => {
                                setActiveTransition(trans.id);
                                setTransitionFlash(true);
                                flashStatus(`⚡ Applied cinematic transition: "${trans.label.split(' ').slice(1).join(' ')}" между сценами!`);
                                setTimeout(() => setTransitionFlash(false), 900);
                              }}
                              className={`p-2 rounded-lg text-left text-[8.5px] font-bold border transition ${
                                activeTransition === trans.id
                                  ? 'bg-purple-950/40 border-purple-400 text-purple-300'
                                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {trans.label}
                            </button>
                          ))}
                        </div>

                        {/* INTER-TOOL SHORTCUT LINK */}
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550">
                          <span>Add background music?</span>
                          <button 
                            onClick={() => setCurrentToolTab('audio')}
                            className="text-[#a855f7] hover:underline uppercase font-bold"
                          >
                            Sound Deck &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {currentToolTab === 'retouch' && (
                      <div className="space-y-2.5 text-zinc-300">
                        <span className="text-[8.5px] font-black uppercase text-[#a855f7] tracking-wider block">AI Face portrait Retouching sliders:</span>
                        
                        <div className="space-y-1.5 bg-zinc-900/60 p-2 rounded-lg border border-white/5 text-[8.5px]">
                          <div>
                            <div className="flex justify-between font-mono mb-0.5">
                              <span>✨ Face Skin Smooth</span>
                              <span className="text-[#a855f7]">{skinSmoothness}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={skinSmoothness} 
                              onChange={(e) => setSkinSmoothness(parseInt(e.target.value))} 
                              className="w-full accent-[#a855f7] h-0.5 bg-zinc-850 rounded appearance-none"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between font-mono mb-0.5">
                              <span>👁️ Wide eye focus</span>
                              <span className="text-cyan-400">{eyeEnlarger}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={eyeEnlarger} 
                              onChange={(e) => setEyeEnlarger(parseInt(e.target.value))} 
                              className="w-full accent-cyan-500 h-0.5 bg-zinc-850 rounded appearance-none"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between font-mono mb-0.5">
                              <span>🦷 teeth whitener</span>
                              <span className="text-emerald-400">{teethWhitening}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={teethWhitening} 
                              onChange={(e) => setTeethWhitening(parseInt(e.target.value))} 
                              className="w-full accent-emerald-500 h-0.5 bg-zinc-850 rounded appearance-none"
                            />
                          </div>
                        </div>

                        {/* INTER-TOOL SHORTCUT LINK */}
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550">
                          <span>Modify Color Filter Preset?</span>
                          <button 
                            onClick={() => setCurrentToolTab('luts')}
                            className="text-[#a855f7] hover:underline uppercase font-bold"
                          >
                            Color Filter LUTs &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {currentToolTab === 'text' && (
                      <div className="space-y-2.5">
                        <span className="text-[8.5px] font-black uppercase text-[#a855f7] tracking-wider block">Subtitle Caption Colors Tokyo presets:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'glow-yellow', label: '🌟 Yellow Glow (Default)' },
                            { id: 'gradient-pink', label: '🌸 Pink Blossom Glow' },
                            { id: 'highlight-cyan', label: '⚡ Tokyo Neon Cyan' },
                            { id: 'cyber-green', label: '🫧 Cyber Electric Green' },
                            { id: 'white', label: '🤍 Minimal Clean White' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => {
                                setMobileSubtitleStyle(style.id);
                                setActiveCaptionStyle(style.id);
                                flashStatus(`📝 Subtitle style set to "${style.label.split(' ').slice(1).join(' ')}"!`);
                              }}
                              className={`p-1.5 rounded text-left text-[8px] font-bold border ${
                                mobileSubtitleStyle === style.id
                                  ? 'bg-[#1e1b4b] border-cyan-400 text-cyan-300 font-extrabold'
                                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>

                        {/* INTER-TOOL SHORTCUT LINK */}
                        <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550">
                          <span>Generate Speech voice?</span>
                          <button 
                            onClick={() => setCurrentToolTab('voice')}
                            className="text-purple-400 hover:underline uppercase font-bold"
                          >
                            AI Voice Dub Synthesizer &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* MULTI_TRACK SIMULATED AUDIO/VIDEO TIMELINE VIEWPORT */}
                  <div className="bg-[#050507] p-2 relative flex flex-col h-38 overflow-x-auto custom-scrollbar select-none" id="mobile-viewport-container">
                    <div 
                      className="relative flex flex-col space-y-1.5 min-w-full transition-all duration-150 ease-out fill-none"
                      style={{ width: `${mobZoom * 100}%` }}
                    >
                      {/* Time indicator marks */}
                      <div className="h-4 border-b border-white/5 relative flex items-center justify-between text-[7px] font-mono text-zinc-650 px-1 select-none">
                        <span>0.0s</span>
                        <span>2.5s</span>
                        <span>5.0s</span>
                        <span>7.5s</span>
                        <span>10.0s</span>
                        <div className="absolute top-0 bottom-0 left-[35%] w-[1.5px] bg-rose-500 z-30 pointer-events-none">
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full -ml-[2px] shadow shadow-rose-500/65"></div>
                        </div>
                      </div>

                      {/* Captions subtitles layer track */}
                      <div 
                        onClick={() => {
                          setSelectedTrack('subtitles');
                          setCurrentToolTab('controls');
                          flashStatus("Selected subtitles track layer. Automatically loaded text caption style guidelines.");
                        }}
                        className={`h-7 relative rounded-lg border flex items-center px-2 cursor-pointer transition-all ${
                          selectedTrack === 'subtitles'
                            ? 'border-[#06b6d4] bg-[#0891b2]/10 ring-1 ring-[#06b6d4]/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                            : 'border-white/5 bg-zinc-950/40 hover:bg-zinc-950/20'
                        }`}
                      >
                        <span className="text-[7.5px] font-black uppercase text-[#a5f3fc] mr-2 shrink-0">Subtitles</span>
                        <div className="flex-1 bg-[#155e75]/20 border border-cyan-500/25 h-4.5 rounded flex items-center justify-start px-2 font-mono text-[8px] text-cyan-300 truncate">
                          "{activeCaptions}"
                        </div>
                        {selectedTrack === 'subtitles' && (
                          <div className="absolute right-2 text-[6.5px] text-cyan-400 font-extrabold font-mono uppercase bg-cyan-950/50 px-1 rounded">ACTIVE TEXT</div>
                        )}
                      </div>

                      {/* Video segment layer track */}
                      <div 
                        onClick={() => {
                          setSelectedTrack('video');
                          setCurrentToolTab('controls');
                          flashStatus("Selected video timeline track segment. Loaded speed curve and color multipliers.");
                        }}
                        className={`h-9 relative rounded-lg border flex items-center px-1.5 gap-0.5 overflow-hidden cursor-pointer transition-all ${
                          selectedTrack === 'video'
                            ? 'border-purple-550/80 bg-purple-950/10 ring-1 ring-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                            : 'border-white/5 bg-zinc-950/40 hover:bg-zinc-950/20'
                        }`}
                      >
                        <span className="text-[7.5px] font-black uppercase text-violet-400 mr-2 shrink-0 font-medium">Video</span>
                        
                        <div className="flex-1 h-6 bg-zinc-900 rounded border border-purple-500/10 flex items-center justify-around relative overflow-hidden">
                          {/* Segment slices */}
                          {videoSegments.map((pct, idx) => (
                            <div 
                              key={idx} 
                              style={{ left: `${pct}%` }} 
                              className="absolute top-0 bottom-0 w-[1.5px] bg-zinc-950 z-25"
                            >
                              <span className="absolute -top-1 left-0.5 text-[6.5px] text-zinc-550 font-mono">#{idx+1}</span>
                            </div>
                          ))}

                          <div className="absolute inset-0 flex items-center justify-start px-2 text-left bg-[#4c1d95]/10 font-bold text-[8.5px] font-mono text-purple-300 truncate">
                            {activeTitle}
                          </div>

                          {/* Render active spatial keyframe diamonds */}
                          {timelineKeyframes.map((kfTime) => (
                            <div 
                              key={kfTime}
                              style={{ left: `${(kfTime / 10) * 100}%` }}
                              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#f59e0b] border border-white shadow shadow-orange-550/50 z-30"
                              title={`Keyframe at ${kfTime}s`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Audio segments layer track */}
                      <div 
                        onClick={() => {
                          setSelectedTrack('audio');
                          setCurrentToolTab('controls');
                          flashStatus("Selected audio track. Open sound adjustments and voice synthesizers.");
                        }}
                        className={`h-8 relative rounded-lg border flex items-center px-2 cursor-pointer transition-all ${
                          selectedTrack === 'audio'
                            ? 'border-emerald-500/85 bg-emerald-950/10 ring-1 ring-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                            : 'border-white/5 bg-zinc-950/40 hover:bg-zinc-950/20'
                        }`}
                      >
                        <span className="text-[7.5px] font-black uppercase text-[#cbd5e1] mr-2 shrink-0">Audio</span>
                        {extractedAudioName || activeAudioBeatTrack ? (
                          <div className="flex-1 bg-emerald-950/20 border border-emerald-500/20 h-5 rounded flex items-center justify-between px-2 text-emerald-400 font-mono text-[8px] py-0.5 truncate relative">
                            <span className="truncate flex items-center gap-1">
                              <Volume2 className="w-2.5 h-2.5" />
                              {extractedAudioName || activeAudioBeatTrack}
                            </span>
                            <span className="text-[6.5px] text-emerald-555 font-bold">SYNC WAVE</span>
                          </div>
                        ) : (
                          <div className="flex-1 border border-dashed border-white/5 h-5 rounded flex items-center justify-center text-[7.5px] text-zinc-650">
                            No overlay active. Click controls below or click Music / Extract Audio.
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Desktop Dashboard Companion & Advanced Exporter/Share Interface */}
      <div className="flex-1 flex flex-col space-y-6 text-left">
        
        {/* UPPER DASHBOARD BANNER */}
        <div className="bg-[#0f0f12] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -inset-10 bg-gradient-to-tr from-purple-500/5 via-indigo-500/2 to-cyan-500/5 blur-xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <CapClipLogo variant="horizontal" className="scale-110 origin-left" />
                <span className="text-[10px] font-black tracking-wider text-purple-400 bg-purple-950/40 px-2 py-1 rounded-md border border-purple-500/20">MOBILE SIMULATOR</span>
              </div>
              <p className="text-sm text-zinc-400">
                Explore a dual high-fidelity sandbox including full text-to-speech synthesize dubbing, video sound demuxing, printable storyboard blueprints, and social feed previews.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950 p-2 border border-white/5 rounded-2xl">
              <CloudLightning className="w-5 h-5 text-indigo-400 animate-pulse" />
              <div className="text-left">
                <span className="text-[9px] text-zinc-550 block font-black font-mono">DATABASE SECURE MODE</span>
                <span className="text-xs font-bold text-[#34d399] flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Authenticated Save Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EXTRA DETAILS SECTION (Simulating user specifications) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* USER SPECIFICATION 1: UPLOAD & AUDIO EXTRACTION MODULE */}
          <div className="bg-[#0f0f13] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200">User Clips & Sound Extraction</h3>
            </div>

            <p className="text-xs text-zinc-400 text-left leading-relaxed">
              Drag-and-drop or select actual files to simulate production imports. Highlighted clips immediately support our <strong>AI Vocal Extractor</strong>, stripping music tracks to sync seamlessly across overlays.
            </p>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Fast Upload Presets:</span>
                <span className="text-[9.5px] text-zinc-500 font-mono">(Click to simulate raw catalog)</span>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'ACTION_MOTORCYCLE_RUSH.mp4', size: '48.2 MB', category: 'Action' },
                  { name: 'CALM_RAIN_CAFE_SOUNDS.wav', size: '12.5 MB', category: 'SFX Audio' },
                  { name: 'AESTHETIC_INTERVIEW_DUB.mov', size: '94.0 MB', category: 'Interview Video' }
                ].map((preset, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 block">{preset.name}</span>
                      <span className="text-[10px] text-zinc-550">{preset.size} &bull; {preset.category}</span>
                    </div>
                    <button
                      onClick={() => addNewMockClip(preset.name, preset.name.includes('mp4') || preset.name.includes('mov') ? 'video' : 'audio', preset.size)}
                      className="p-1 px-2.5 text-[9.5px] font-black uppercase text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 rounded hover:bg-cyan-950/50"
                    >
                      Import Folder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* USER SPECIFICATION 2: REALISTIC AI VOICE DUBBINGS */}
          <div className="bg-[#0f0f13] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
                <Mic className="w-1.5 h-4.5 text-purple-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200">Realistic Voice Synthesis</h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed text-left">
              Type custom voice scripts inside our smartphone simulation. Test multiple vocal actors, adjust speed properties, and generate instant synced caption subtitle tracks on completion.
            </p>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Selected Model Specifications:</span>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Voice Actor:</span>
                  <span className="font-mono text-purple-400 font-bold">Liam Oliver Docs</span>
                </div>
                <div className="flex justify-between">
                  <span>Synthesize Channel:</span>
                  <span className="font-mono text-zinc-300">Deep Neural Network Core</span>
                </div>
                <div className="flex justify-between">
                  <span>Lip-Sync Target:</span>
                  <span className="font-mono text-zinc-300">Synchronized (0.0s - 3.5s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Sample Rate:</span>
                  <span className="font-mono text-zinc-300">48,000 Hz Lossless WAV</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* PREVIEW OF 4,000+ DYNAMIC REELS STOCKED */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-3xl p-6 space-y-4 text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200">4,000+ Scalable Creative Templates</h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Harness a limitless catalog of community-graded presets curated weekly on high performance CDN media hubs. Jump to specific page offsets directly on the paginator, click "Use template" on the smartphone catalog, and watch custom assets open inside the live 4K staging screen instantaneously.
          </p>
        </div>

      </div>

      {/* RENDER EXPORT MODAL OPTIONS OVERLAY */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-400 animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-md font-black uppercase text-zinc-200">Compiling 4K Render Package</h3>
                <p className="text-xs text-zinc-500">Integrating audio waveform splits & cinematic LUT grade rules...</p>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div style={{ width: `${exportProgress}%` }} className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100"></div>
              </div>

              <span className="text-sm font-bold font-mono text-indigo-400">{exportProgress}% Completed</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportSuccess && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Check className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-zinc-100">Compiled Render Ready!</h3>
                <p className="text-[11px] text-zinc-500">Your output has been compiled and cataloged securely on Cloud nodes.</p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-xl space-y-2 text-left text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Video Title:</span>
                  <span className="text-zinc-200 font-bold truncate max-w-[140px]">{activeTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>LUT Style:</span>
                  <span className="text-zinc-200 font-bold uppercase">{activeLut.replace('lut-', '')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-zinc-200 font-bold font-mono">{totalTime} Seconds</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition cursor-pointer"
                >
                  Share to Social Feeds
                </button>
                
                <button
                  onClick={() => setExportSuccess(false)}
                  className="w-full py-2 bg-zinc-900 border border-white/5 text-zinc-400 font-extrabold text-xs uppercase rounded-xl hover:bg-zinc-800 transition"
                >
                  OK Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SMARTPHONE EXPORTER POPUP CONTROL */}
      <AnimatePresence>
        {isExporting === false && exportSuccess === false && screen === 'editor' && (
          // Render inside simulator overlay optionally or direct UI controller
          null
        )}
      </AnimatePresence>

      {/* ADVANCED EXPORTER DIALOG TRIGGERED INSIDE EDITOR (We can launch via Simulator or Master Container) */}
      <AnimatePresence>
        {isExporting === false && exportSuccess === false && screen === 'editor' && (
          // Extra slide-up triggers for downloadable options
          null
        )}
      </AnimatePresence>

      {/* MASTER SIMULATOR SCREEN OVERLAY EXPORTS (renders when export requested) */}
      {screen === 'editor' && (
        <div className="fixed bottom-4 right-4 z-40 bg-zinc-950 border border-white/10 p-4 rounded-3xl w-72 shadow-2xl space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#cbd5e1] font-black uppercase tracking-wider flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Advanced Storage Exp.
            </span>
          </div>
          
          <p className="text-[10px] text-zinc-500 leading-normal">
            Download your simulated video project directly or create production storyboard PDF drafts securely.
          </p>

          <div className="grid grid-cols-1 gap-1.5 text-[9.5px]">
            <button
              onClick={() => startExportAction('mp4')}
              className="w-full py-1.5 bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-300 font-bold block text-left px-2.5 rounded-lg flex items-center justify-between"
            >
              <span>📥 Download 4K MP4 Clip</span>
              <span className="text-[7.5px] text-zinc-650 font-mono">STG</span>
            </button>
            <button
              onClick={() => startExportAction('gallery')}
              className="w-full py-1.5 bg-zinc-900 border border-white/5 hover:border-white/15 text-zinc-300 font-bold block text-left px-2.5 rounded-lg flex items-center justify-between"
            >
              <span>💾 Save direct to Mobile Gallery</span>
              <span className="text-[7.5px] text-zinc-650 font-mono">ALB</span>
            </button>
            <button
              onClick={() => startExportAction('pdf')}
              className="w-full py-1.5 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/20 text-purple-300 font-bold block text-left px-2.5 rounded-lg flex items-center justify-between"
            >
              <span>🗒️ Download Storyboard PDF</span>
              <span className="text-[7.5px] text-purple-400 font-mono">PRINT</span>
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC SOCIAL MEDIA FEED SHARING PREVIEW MOCKUP MODAL */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl max-w-4xl w-full p-6 text-center space-y-6 shadow-2xl relative font-sans flex flex-col md:flex-row gap-6 text-left"
            >
              <button 
                onClick={() => { setIsShareModalOpen(false); setShareSuccessNotification(false); }}
                className="absolute right-4 top-4 hover:bg-zinc-900 p-1.5 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* LEFT HALF: Live Feed Emulator Smartphone Layout */}
              <div className="md:w-[350px] shrink-0 bg-[#0c0c0e] rounded-[42px] border-[8px] border-[#222227] h-[520px] relative overflow-hidden flex flex-col ring-1 ring-white/10 select-none">
                
                {/* Feeds header navigation mock and tags */}
                <div className="h-10 px-4 flex items-center justify-between bg-zinc-950/70 text-[10px] text-zinc-400 font-bold tracking-wide border-b border-white/5 uppercase shrink-0">
                  <span className="text-zinc-200 font-sans">{sharingPlatform} reel</span>
                  <div className="flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span>
                    <span className="text-[#a855f7] font-mono leading-none font-black text-[9px]">LIVE PREVIEW</span>
                  </div>
                </div>

                {/* Simulated feed video stages */}
                <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
                  <video 
                    src={activeVideoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* UI Overlay HUD mockups based on Instagram or TikTok */}
                  <div className="absolute right-2 bottom-12 flex flex-col gap-3.5 text-center items-center text-white z-20">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-600/30 backdrop-blur-md flex items-center justify-center">
                        <Heart className="w-4.5 h-4.5 fill-rose-500 text-rose-500 animate-pulse" />
                      </div>
                      <span className="text-[9px] mt-0.5 font-bold">124K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                        <MessageSquare className="w-4.5 h-4.5 text-white" />
                      </div>
                      <span className="text-[9px] mt-0.5 font-bold">3,820</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                        <Share2 className="w-4.5 h-4.5 text-white" />
                      </div>
                      <span className="text-[9px] mt-0.5 font-bold">Share</span>
                    </div>
                  </div>

                  {/* Caption banner overlay bottom left */}
                  <div className="absolute left-3 bottom-3 right-12 text-left text-white text-xs drop-shadow-md z-20 space-y-1">
                    <span className="font-extrabold text-blue-300">@{user ? user.displayName?.toLowerCase().replace(/\s+/g, '') : 'creative_guest'}</span>
                    <p className="text-[9.5px] leading-relaxed line-clamp-2 text-zinc-200">
                      {shareCaptionText}
                    </p>
                  </div>

                  <div className="absolute inset-0 bg-transparent shadow-[inset_0_-80px_40px_rgba(0,0,0,0.5)]"></div>
                </div>

              </div>

              {/* RIGHT HALF: Sharing Control Config Panels */}
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase text-zinc-100 flex items-center gap-1.5">
                      <CloudLightning className="w-5 h-5 text-indigo-400" />
                      Direct Share Hub
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Type dynamic captions, inject hashtags and immediately publish live to target accounts.
                    </p>
                  </div>

                  {/* Channel select */}
                  <div className="space-y-2">
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-300 block font-mono">Target Channel Profile Account:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'instagram', name: 'Insta Reels', color: 'from-pink-500 to-rose-500' },
                        { id: 'tiktok', name: 'Tik Tok', color: 'from-black to-zinc-800' },
                        { id: 'youtube', name: 'YT Shorts', color: 'from-red-600 to-red-700' },
                        { id: 'facebook', name: 'FB Watch', color: 'from-blue-600 to-indigo-600' }
                      ].map((plat) => (
                        <button
                          key={plat.id}
                          onClick={() => {
                            setSharingPlatform(plat.id as any);
                            setShareCaptionText(`Tuned with brand new advanced AI on ${plat.name}! 🎬⚡ #AdvancedAIVideo #CapClipIntelligent`);
                            flashStatus(`Switched target feed layout to ${plat.name}`);
                          }}
                          className={`p-2 rounded-xl text-center text-xs font-bold ring-1 transition ${
                            sharingPlatform === plat.id 
                              ? `bg-gradient-to-r ${plat.color} text-white ring-white/20 shadow-md` 
                              : 'bg-[#18181b] ring-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {plat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption editor box */}
                  <div className="space-y-2">
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-300 block font-mono">Post Description & Hashtags:</label>
                    <textarea
                      value={shareCaptionText}
                      onChange={(e) => setShareCaptionText(e.target.value)}
                      placeholder="Insert customized hashtag sequences..."
                      className="w-full h-24 bg-zinc-905 border border-zinc-800 focus:border-purple-500/30 rounded-xl p-3 text-xs text-white leading-normal font-sans outline-none"
                    />

                    <div className="flex gap-1.5 flex-wrap">
                      {['#CreatorsTools', '#AIVideoEditing', '#RunwayArt', '#ViralReels', '#IntelligentCapClip'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setShareCaptionText(prev => prev + ' ' + tag)}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[9.5px] text-zinc-400 hover:text-white"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  {isPublishingShare && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                        <span>Pushing to social delivery nodes...</span>
                        <span>45%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 animate-[pulse_1s_infinite]" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  )}

                  {shareSuccessNotification && (
                    <div className="p-3 bg-emerald-990/20 border border-emerald-500/25 rounded-2xl flex items-center justify-start gap-2 text-emerald-400 text-xs">
                      <Check className="w-5 h-5 shrink-0" />
                      <div>
                        <strong className="block font-sans">Successfully published!</strong>
                        <span>The video loop is now live on original profile under ID stream.</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handlePublishSocialPost}
                      disabled={isPublishingShare}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition cursor-pointer"
                    >
                      {isPublishingShare ? 'Publishing...' : `Post Now onto ${sharingPlatform.toUpperCase()}`}
                    </button>
                    
                    <button
                      onClick={() => setIsShareModalOpen(false)}
                      className="py-3 px-4 bg-zinc-900 border border-white/5 text-zinc-400 font-bold text-xs uppercase rounded-xl hover:bg-zinc-800 transition"
                    >
                      Close Overlay
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXPANDABLE "MORE TOOLS" PANEL MODAL */}
      <AnimatePresence>
        {showMoreToolsPanel && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-2xl max-w-sm w-full p-5 text-left space-y-4 shadow-2xl relative font-sans"
            >
              <button
                onClick={() => setShowMoreToolsPanel(false)}
                className="absolute right-4 top-4 hover:bg-zinc-900 p-1.5 rounded-full text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Grid className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">🎛️ Advanced Creators toolbox</h3>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Curve Speed multipliers */}
                <div>
                  <label className="block text-[8.5px] font-black uppercase text-zinc-400 mb-1">📈 Velocity Curve Presets</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'normal', name: 'Standard (1.0x)', desc: 'Original velocity' },
                      { id: 'montage', name: 'Montage (2.5x)', desc: 'Ramping timeline' },
                      { id: 'bullet', name: 'Bullet Time (0.2x)', desc: 'Frame-by-frame draw' },
                      { id: 'jump', name: 'Jump Cut (4.0x)', desc: 'High transition drops' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveCurveSpeed(item.id);
                          flashStatus(`Applied velocity curve speed: ${item.name}`);
                        }}
                        className={`p-2 rounded-xl border text-left transition select-none ${
                          activeCurveSpeed === item.id
                            ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                            : 'bg-[#18181b]/50 border-white/5 text-zinc-450 hover:bg-[#18181b] hover:text-white'
                        }`}
                      >
                        <div className="font-extrabold text-[9.5px]">{item.name}</div>
                        <div className="text-[7.5px] text-zinc-500 -mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blending Modes & Masking */}
                <div className="grid grid-cols-2 gap-2.5 border-t border-white/5 pt-2.5">
                  <div>
                    <label className="block text-[8.5px] font-black uppercase text-zinc-400 mb-1">🎭 Blend Modes</label>
                    <select
                      value={activeBlendMode}
                      onChange={(e) => {
                        setActiveBlendMode(e.target.value);
                        flashStatus(`Active blend set to: ${e.target.value.toUpperCase()}`);
                      }}
                      className="w-full bg-zinc-900 border border-white/5 text-zinc-300 px-2 py-1.5 rounded-lg font-bold text-[10px] outline-none hover:border-purple-500/20"
                    >
                      <option value="normal">Normal Alpha</option>
                      <option value="overlay">Overlay Layer</option>
                      <option value="screen">Screen Bright</option>
                      <option value="multiply">Multiply Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8.5px] font-black uppercase text-zinc-400 mb-1">🧩 Advanced Masking</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => flashStatus("Linear video masking preset oriented at 45°")}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-1.5 px-1 rounded-lg border border-white/5 font-extrabold text-[9px] text-center"
                      >
                        📐 Linear
                      </button>
                      <button
                        onClick={() => flashStatus("Circular vignette focus clipping locked.")}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-1.5 px-1 rounded-lg border border-white/5 font-extrabold text-[9px] text-center"
                      >
                        ⭕ Vignette
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chroma Key Background */}
                <div className="border-t border-white/5 pt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[8.5px] font-black uppercase text-zinc-400">🟢 Chroma Key Keying Filter</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={chromaKeyEnabled}
                        onChange={(e) => {
                          setChromaKeyEnabled(e.target.checked);
                          flashStatus(`Chroma key cutout: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                        }}
                        className="w-3.5 h-3.5 accent-purple-550 rounded cursor-pointer"
                        id="chk-chroma-more"
                      />
                      <label htmlFor="chk-chroma-more" className="text-[8.5px] font-bold text-zinc-500 uppercase cursor-pointer">Enable</label>
                    </div>
                  </div>
                  
                  {chromaKeyEnabled && (
                    <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-xl border border-white/5">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold">Key Color Sync:</span>
                      <div className="flex gap-1.5">
                        {[
                          { hex: '#22c55e', name: 'Green screen' },
                          { hex: '#3b82f6', name: 'Blue screen' },
                          { hex: '#ef4444', name: 'Red screen' }
                        ].map((col) => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              setChromaKeyColor(col.hex);
                              flashStatus(`Chroma Key color frequency synced: ${col.name}`);
                            }}
                            className={`w-5.5 h-5.5 rounded-full border transition relative ${
                              chromaKeyColor === col.hex ? 'border-white scale-110 shadow-md ring-1 ring-white/20' : 'border-transparent opacity-60'
                            }`}
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Enhance Upscaler */}
                <div className="border-t border-white/5 pt-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[8.5px] font-black uppercase text-zinc-400">🤖 AI Intelligent upscaling</div>
                    <div className="text-[7.5px] text-zinc-500">Neural dynamic super-res and beat sync</div>
                  </div>
                  <button
                    onClick={() => {
                      setAiEnhanceActive(!aiEnhanceActive);
                      flashStatus(aiEnhanceActive ? "Deactivated active AI upscaling details check" : "Restoring clip resolution via neural shaders...");
                    }}
                    className={`py-1.5 px-2.5 rounded-xl border font-black text-[8px] transition uppercase cursor-pointer flex items-center gap-1 ${
                      aiEnhanceActive
                        ? 'bg-purple-900/40 border-purple-500 text-purple-300'
                        : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {aiEnhanceActive ? (
                      <>
                        <RefreshCw className="w-2.5 h-2.5 text-purple-400 animate-spin" />
                        <span>ACTIVE</span>
                      </>
                    ) : (
                      'RESTORE'
                    )}
                  </button>
                </div>

              </div>

              <div className="border-t border-white/5 pt-3.1 flex items-center justify-between">
                <span className="text-[7.5px] text-zinc-550 font-mono">Workspace: PRO MODEL</span>
                <button
                  onClick={() => setShowMoreToolsPanel(false)}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold uppercase rounded-lg text-[9px] shadow"
                >
                  Confirm presets
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
