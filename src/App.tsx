/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Cpu, FileVideo, Film, Check, ExternalLink, Play, Pause, RefreshCw, 
  Sparkles, Video, Volume2, Plus, ArrowRight, MessageSquare, ListMusic, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrackClip, CaptionEntry, StoryboardResponse, StoryboardScene } from './types';
import { VIDEO_PRESETS, IMAGE_PRESETS, LUT_PRESETS } from './utils/constants';
import PreviewCanvas from './components/PreviewCanvas';
import Timeline from './components/Timeline';
import ToolPanel from './components/ToolPanel';
import ExportModal from './components/ExportModal';
import ChatIntegrationModal from './components/ChatIntegrationModal';
import CapCutMobileSimulator from './components/CapCutMobileSimulator';
import CapClipLogo from './components/CapClipLogo';

export default function App() {
  // --- Timelines & Playback states ---
  const [playhead, setPlayhead] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineDuration, setTimelineDuration] = useState<number>(15.0);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  
  // Active clips collections
  const [clips, setClips] = useState<TrackClip[]>([
    {
      id: 'default-video',
      type: 'video',
      title: 'Cyberpunk Neon Street (Sample)',
      url: VIDEO_PRESETS[0].url,
      start: 0,
      duration: 15.0,
      sourceStart: 0,
      speed: 1.0,
      adjustments: {
        exposure: 10,
        contrast: 15,
        saturation: 20,
        temperature: -10,
        hue: 0,
      },
      stylePreset: 'lut-cyber',
      transitionIn: 'fade',
      scale: 1.0,
      posY: 0,
    }
  ]);

  const [selectedClipId, setSelectedClipId] = useState<string | null>('default-video');
  const [captions, setCaptions] = useState<CaptionEntry[]>([
    { start: 0.5, end: 4.0, text: '✨ Welcome to CapClip Creative Studio! ✨', style: 'gradient-pink' },
    { start: 4.0, end: 8.5, text: '💡 Unleash 18 pro-grade tools & server-side Gemini AI features.', style: 'glow-yellow' },
    { start: 8.5, end: 14.0, text: '🔥 Edit on-the-go with real-time video color wheels, LUTs and sound dubs!', style: 'highlight-cyan' }
  ]);

  // Audio beats peaks parameters
  const [beatsActive, setBeatsActive] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Storyboard generation states
  const [activeStoryboard, setActiveStoryboard] = useState<StoryboardResponse | null>(null);

  // Custom Exporter modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  
  // App view mode layout toggle state
  const [activeAppMode, setActiveAppMode] = useState<'desktop-studio' | 'mobile-simulator'>('mobile-simulator');

  // Active clip retrieval
  const activeClip = clips.find((c) => c.id === selectedClipId) || null;

  // Frame timer for smooth non-linear scrub update
  useEffect(() => {
    let lastTime = performance.now();
    let animFrame: number;

    const updateFrame = () => {
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setPlayhead((prev) => {
          const next = prev + elapsed * speedMultiplier;
          if (next >= timelineDuration) {
            return 0; // Loop playhead playback
          }
          return next;
        });
      }

      animFrame = requestAnimationFrame(updateFrame);
    };

    animFrame = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, speedMultiplier, timelineDuration]);

  // Handle playhead scrubber dragging updates
  const handlePlayheadChange = (time: number) => {
    setPlayhead(time);
  };

  // Select dynamic clip
  const handleSelectClip = (clip: TrackClip) => {
    setSelectedClipId(clip.id);
  };

  // Modify active clip's properties safely
  const handleUpdateClip = (updatedClip: TrackClip) => {
    setClips((prev) => prev.map((c) => (c.id === updatedClip.id ? updatedClip : c)));
  };

  // Insert a PIP/Sticker overlay layered block
  const handleAddOverlayClip = (newClip: TrackClip) => {
    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Add synthesized narrative loop FX to Audio Track
  const handleInjectAudioClip = (title: string, sfxUrl: string, duration: number) => {
    const sfxId = 'sfx-' + Math.random().toString(36).substr(2, 5);
    const audioClip: TrackClip = {
      id: sfxId,
      type: 'audio',
      title: title,
      url: sfxUrl,
      start: playhead,
      duration: Math.min(duration, timelineDuration - playhead),
      sourceStart: 0,
      speed: 1.0,
    };
    setClips((prev) => [...prev, audioClip]);
    setSelectedClipId(audioClip.id);
  };

  // Splitting clips at the exact current playhead
  const handleSplitClip = () => {
    if (!activeClip) return;
    
    const splitPoint = playhead;
    if (splitPoint <= activeClip.start || splitPoint >= activeClip.start + activeClip.duration) {
      return; // playhead outside range
    }

    const firstSegmentDuration = splitPoint - activeClip.start;
    const secondSegmentDuration = activeClip.duration - firstSegmentDuration;

    // Segment 1 (pre-cut)
    const segment1: TrackClip = {
      ...activeClip,
      id: `${activeClip.id}-seg1`,
      duration: firstSegmentDuration,
    };

    // Segment 2 (post-cut)
    const segment2: TrackClip = {
      ...activeClip,
      id: `${activeClip.id}-seg2`,
      start: splitPoint,
      duration: secondSegmentDuration,
      sourceStart: activeClip.sourceStart + firstSegmentDuration,
    };

    setClips((prev) => {
      const filtered = prev.filter((c) => c.id !== activeClip.id);
      return [...filtered, segment1, segment2];
    });

    setSelectedClipId(segment2.id);
  };

  // Deleting audio, video or PIP blocks from track structure
  const handleDeleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    setSelectedClipId(null);
  };

  // Applying Gemini-generated comprehensive story scenarios as playable footage
  const handleAddStoryboardScenes = (storyboard: StoryboardResponse) => {
    setActiveStoryboard(storyboard);
    
    // Convert scenes list into active structural layout clips in the video track
    let accumTime = 0;
    const storyboardClips: TrackClip[] = storyboard.scenes.map((scene, index) => {
      // Map filter preset strings to standard LUTs
      let selectedLut = 'lut-none';
      if (scene.filterPreset.includes('Teal')) selectedLut = 'lut-teal';
      else if (scene.filterPreset.includes('Cyber')) selectedLut = 'lut-cyber';
      else if (scene.filterPreset.includes('Retro')) selectedLut = 'lut-retro';
      else if (scene.filterPreset.includes('Moody')) selectedLut = 'lut-moody';

      // Distribute Pexels / Google sample assets based on style indices
      const videoAsset = VIDEO_PRESETS[index % VIDEO_PRESETS.length];

      return {
        id: `storyboard-sc-${scene.sceneNumber}-${index}`,
        type: 'video',
        title: `Scene ${scene.sceneNumber}: ${scene.filterPreset}`,
        url: videoAsset.url,
        start: accumTime,
        duration: scene.duration,
        sourceStart: 0,
        speed: 1.0,
        adjustments: {
          exposure: 15,
          contrast: 10,
          saturation: 15,
          temperature: 0,
          hue: 0,
        },
        stylePreset: selectedLut,
      };
    });

    // Reset clips timeline array with storyboard elements
    setClips(storyboardClips);
    
    // Automatically recalculate duration
    const totalDuration = storyboard.scenes.reduce((acc, curr) => acc + curr.duration, 0);
    setTimelineDuration(totalDuration);

    // Pick first scene
    if (storyboardClips.length > 0) {
      setSelectedClipId(storyboardClips[0].id);
    }

    // Adapt captions mapping precisely with narrative text segments
    let tempCapAccum = 0;
    const storyCaptions: CaptionEntry[] = storyboard.scenes.map((scene, idx) => {
      const start = tempCapAccum;
      const end = tempCapAccum + scene.duration;
      tempCapAccum = end;

      // Cycles beautiful styles
      const styles: CaptionEntry['style'][] = ['gradient-pink', 'glow-yellow', 'highlight-cyan'];
      return {
        start,
        end,
        text: scene.narration,
        style: styles[idx % styles.length],
      };
    });
    setCaptions(storyCaptions);
    setPlayhead(0);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans overflow-x-hidden relative select-none antialiased">
      
      {/* Upper Navigation Header Brand */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#111111] sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <CapClipLogo variant="horizontal" />
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-gray-400 font-mono tracking-tight uppercase">4K PRO-HDR</span>
          </div>

          {/* Interactive Workspace Mode Selector Tabs */}
          <div className="flex bg-zinc-950 border border-white/5 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveAppMode('mobile-simulator')}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all duration-200 uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                activeAppMode === 'mobile-simulator'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>📱 Mobile Client</span>
            </button>
            <button
              onClick={() => setActiveAppMode('desktop-studio')}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all duration-200 uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                activeAppMode === 'desktop-studio'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>💻 Pro Workspace</span>
            </button>
          </div>
        </div>

        {/* Global status toolbar indicators -- Anti-AI slop clean aesthetics */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-violet-400">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold uppercase tracking-widest font-display">Gemini AI Active</span>
          </div>
          <div className="flex space-x-3 items-center">
            <button
              onClick={() => setIsChatModalOpen(true)}
              className="px-4 py-1.5 rounded text-xs border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 font-semibold transition hover:scale-[1.02] active:scale-98 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback & Ideas</span>
            </button>
            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded text-xs border border-white/20 hover:bg-white/5 text-gray-300 font-medium tracking-wide flex items-center gap-1.5 transition"
            >
              <span>Learn Studio</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-lg shadow-blue-600/10"
            >
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace container */}
      <main className="max-w-7xl mx-auto p-4 lg:p-7 space-y-6 font-sans">
        
        {activeAppMode === 'mobile-simulator' ? (
          /* Futurist glassmorphism mobile app simulator viewport */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CapCutMobileSimulator />
          </motion.div>
        ) : (
          /* Pro-grade multi-track desktop non-linear editing studio workspace */
          <div className="space-y-6">
            {/* Dynamic Studio Layout GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* COLUMN 1: Pinned stock footage & Scene libraries (Left Side, 3 cols) */}
              <section className="lg:col-span-3 flex flex-col gap-5 bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 shadow-2xl">
                {/* Header label */}
                <div className="border-b border-white/10 pb-2.5">
                  <h2 className="text-xs uppercase font-bold tracking-wider text-gray-300 flex items-center gap-1.5 font-display">
                    <Compass className="w-4 h-4 text-blue-400" />
                    Footage Library
                  </h2>
                </div>

                {/* Scrolling list for Video Assets catalog */}
                <div className="flex-1 space-y-3 max-h-[300px] lg:max-h-[380px] overflow-y-auto pr-1">
                  {VIDEO_PRESETS.map((vid) => {
                    const isActive = activeClip?.url === vid.url;
                    return (
                      <button
                        key={vid.id}
                        onClick={() => {
                          const newId = 'video-' + Math.random().toString(36).substr(2, 5);
                          setClips((prev) => [
                            ...prev.filter((c) => c.id !== 'default-video'), // Clean default if applicable
                            {
                              id: newId,
                              type: 'video',
                              title: vid.name,
                              url: vid.url,
                              start: playhead,
                              duration: vid.duration,
                              sourceStart: 0,
                              speed: 1.0,
                              adjustments: { exposure: 0, contrast: 15, saturation: 15, temperature: 0, hue: 0 }
                            }
                          ]);
                          setSelectedClipId(newId);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-3 active:scale-98 transition ${
                          isActive 
                            ? 'bg-violet-600/20 border-violet-500/80 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                            : 'bg-[#050505]/60 border-white/5 hover:border-white/15 text-gray-300'
                        }`}
                      >
                        <div className="w-16 h-11 bg-black rounded-lg overflow-hidden relative shrink-0 ring-1 ring-white/10">
                          <img src={vid.poster} alt={vid.name} className="w-full h-full object-cover" />
                          <div className="absolute right-1 bottom-1 bg-black/80 px-1 text-[8px] font-mono rounded text-zinc-300">
                            HD
                          </div>
                        </div>
                        <div className="truncate flex-1">
                          <h4 className="text-xs font-semibold text-gray-100 truncate">{vid.name}</h4>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase mt-0.5 font-mono">
                            <span>{vid.category}</span>
                            <span>&bull;</span>
                            <span>{(vid.duration).toFixed(0)}s</span>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-gray-500 hover:text-white" />
                      </button>
                    );
                  })}
                </div>

                {/* AI storyboard scenarios list if available */}
                {activeStoryboard && (
                  <div className="mt-2 pt-3 border-t border-white/10">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 font-display">
                      🗒️ Gemini Scene Storyboard
                    </span>
                    
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      <div className="bg-[#050505] border border-white/10 p-2.5 rounded-lg mb-2">
                        <span className="block text-[10px] text-gray-500 font-bold leading-none truncate font-display">
                          TRANSCRIPT TOPIC:
                        </span>
                        <span className="text-xs font-semibold text-violet-400 mt-1 block font-sans">
                          {activeStoryboard.title}
                        </span>
                      </div>

                      {activeStoryboard.scenes.map((scene, index) => (
                        <div 
                          key={index}
                          className="bg-[#111111]/80 p-2.5 border border-white/5 rounded-lg text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold text-gray-500">SCENE {scene.sceneNumber}</span>
                            <span className="text-[9px] bg-violet-600/10 border border-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded font-mono font-medium">{scene.filterPreset}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 mt-1 line-clamp-2 leading-snug">
                            {scene.visualDescription}
                          </p>
                          <p className="text-[10px] text-violet-300 font-mono italic mt-1 bg-black/60 p-1.5 rounded-sm border border-white/5">
                            Voice: "{scene.narration}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* COLUMN 2: Multi-aspect active video space preview (Center Stage, 5 cols) */}
              <section className="lg:col-span-5 flex flex-col justify-stretch">
                <PreviewCanvas
                  activeClip={activeClip}
                  playhead={playhead}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  aspectRatio={aspectRatio}
                  captions={captions}
                  speedMultiplier={speedMultiplier}
                />
              </section>

              {/* COLUMN 3: Real 18 Pro Tools dashboard controller (Right Side, 4 cols) */}
              <section className="lg:col-span-4 select-none">
                <ToolPanel
                  activeClip={activeClip}
                  onUpdateClip={handleUpdateClip}
                  onAddOverlayClip={handleAddOverlayClip}
                  aspectRatio={aspectRatio}
                  onSetAspectRatio={setAspectRatio}
                  captions={captions}
                  onSetCaptions={setCaptions}
                  playhead={playhead}
                  onSetPlayhead={setPlayhead}
                  onAddStoryboardScenes={handleAddStoryboardScenes}
                  onInjectAudioClip={handleInjectAudioClip}
                  speedMultiplier={speedMultiplier}
                  onSetSpeedMultiplier={setSpeedMultiplier}
                  beatsActive={beatsActive}
                  onSetBeatsActive={setBeatsActive}
                />
              </section>

            </div>

            {/* BOTTOM SECTION: Non-linear multi-track editing timeline strip */}
            <section className="select-none">
              <Timeline
                clips={clips}
                playhead={playhead}
                duration={timelineDuration}
                isPlaying={isPlaying}
                onPlayheadChange={handlePlayheadChange}
                onSelectClip={handleSelectClip}
                selectedClipId={selectedClipId}
                captions={captions}
                onSplitClip={handleSplitClip}
                onDeleteClip={handleDeleteClip}
                beatsActive={beatsActive}
                onToggleBeats={() => setBeatsActive(!beatsActive)}
              />
            </section>
          </div>
        )}

      </main>

      {/* Dynamic Master Exporter Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        clips={clips}
        captions={captions}
        aspectRatio={aspectRatio}
        duration={timelineDuration}
      />

      {/* Google Chat Feedbacks Hub */}
      <ChatIntegrationModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />

      {/* Aesthetic credit footer */}
      <footer className="py-8 mt-6 border-t border-zinc-900/60 bg-zinc-950 text-center select-none">
        <p className="text-xs text-zinc-600 font-sans">
          CapClip Studio — Professional Non-Linear Video Editor &bull; Full-Stack Node Environment
        </p>
      </footer>

    </div>
  );
}
