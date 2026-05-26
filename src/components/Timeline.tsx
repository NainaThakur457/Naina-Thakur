/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Video, Type, Music, Play, Pause, Trash2, 
  ChevronRight, Scissors, ArrowDownWideNarrow, Lock, Eye, VolumeX,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { TrackClip, CaptionEntry } from '../types';

interface TimelineProps {
  clips: TrackClip[];
  playhead: number;
  duration: number; // in seconds
  isPlaying: boolean;
  onPlayheadChange: (time: number) => void;
  onSelectClip: (clip: TrackClip) => void;
  selectedClipId: string | null;
  captions: CaptionEntry[];
  onSplitClip: () => void;
  onDeleteClip: (id: string) => void;
  beatsActive: boolean;
  onToggleBeats: () => void;
}

export default function Timeline({
  clips,
  playhead,
  duration,
  isPlaying,
  onPlayheadChange,
  onSelectClip,
  selectedClipId,
  captions,
  onSplitClip,
  onDeleteClip,
  beatsActive,
  onToggleBeats,
}: TimelineProps) {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0); // Timeline zoom multiplier

  // Handles mouse scrubbing interactions on click or drag
  const handleScrub = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onPlayheadChange(percentage * duration);
  };

  // Convert timeline seconds into display layout percentage position inside the track content area
  const getPercent = (time: number) => {
    return (time / duration) * 100;
  };

  // Render vertical ticks on the timeline ruler
  const renderRulerTicks = () => {
    const ticks = [];
    const step = 1; // tick mark every second
    for (let i = 0; i <= duration; i += step) {
      const isMajor = i % 5 === 0;
      ticks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center pointer-events-none"
          style={{ left: `${getPercent(i)}%`, transform: 'translateX(-50%)' }}
        >
          <div className={`w-0.5 ${isMajor ? 'h-3.5 bg-zinc-500' : 'h-2 bg-zinc-700'}`} />
          {isMajor && (
            <span className="text-[9px] font-mono font-bold text-zinc-500 mt-1">
              {i}s
            </span>
          )}
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl font-sans">
      {/* Timeline Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#050505] p-1 rounded-xl border border-white/5">
            <button
              onClick={onSplitClip}
              title="Split selected track at Playhead position"
              disabled={!selectedClipId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none hover:text-white transition"
              id="split-clip-btn"
            >
              <Scissors className="w-3.5 h-3.5 text-violet-400" />
              <span>Split Clip</span>
            </button>
            
            <button
              onClick={onToggleBeats}
              title="AI Beat Match snapping points"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                beatsActive 
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              id="beat-match-btn"
            >
              <Music className="w-3.5 h-3.5" />
              <span>{beatsActive ? '🔊 Beats Active' : 'AI Beat Match'}</span>
            </button>
          </div>

          {selectedClipId && (
            <button
              onClick={() => onDeleteClip(selectedClipId)}
              className="p-1 px-3.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition flex items-center gap-1 font-semibold"
              id="remove-clip-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Clip</span>
            </button>
          )}
        </div>

        {/* Zoom Slider Control Block and Metadata Label */}
        <div className="flex flex-wrap items-center gap-4 justify-between md:justify-end">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 bg-[#050505] px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setZoom(prev => Math.max(1, prev - 0.5))}
              disabled={zoom <= 1}
              title="Zoom Out"
              className="text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 transition p-1"
              id="zoom-out-btn"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              title="Timeline zoom scale range"
              className="w-24 sm:w-32 accent-violet-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-violet-400 transition-colors"
              id="zoom-range-slider"
            />
            <button
              onClick={() => setZoom(prev => Math.min(10, prev + 0.5))}
              disabled={zoom >= 10}
              title="Zoom In"
              className="text-gray-400 hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 transition p-1"
              id="zoom-in-btn"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-violet-400 min-w-[50px] text-right select-none">
              {zoom === 1 ? '1.0x (Fit)' : `${zoom.toFixed(1)}x`}
            </span>
          </div>

          {/* Timeline information info tags */}
          <div className="flex items-center gap-3 text-xs text-gray-400 font-mono bg-[#050505]/60 px-3 py-1.5 rounded-xl border border-white/5 select-none">
            <span>Length: <strong className="text-violet-400 font-sans">{duration}s</strong></span>
            <span className="text-white/10">|</span>
            <span>Rate: <strong className="text-blue-400 font-sans">48kHz</strong></span>
          </div>
        </div>
      </div>

      {/* Editor Main Track Grid - Scrollable Horizontally based on zoom */}
      <div 
        className="relative border border-white/5 bg-[#050505] rounded-xl overflow-x-auto custom-scrollbar shadow-inner"
        id="scrollable-timeline-container"
      >
        <div 
          className="relative flex flex-col min-w-full transition-all duration-150 ease-out" 
          style={{ width: `${zoom * 100}%` }}
        >
          {/* Playhead Scrubber Overlay Bar spanning all rows starting after the sidebar */}
          <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex z-35">
            <div className="w-36 shrink-0" /> {/* dummy spacing to clear standard sticky sidebars width */}
            <div className="flex-1 relative">
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                style={{ left: `${getPercent(playhead)}%` }}
              >
                <div className="absolute top-0 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white" />
              </div>
            </div>
          </div>

          {/* Timeline Ruler Row */}
          <div className="h-10 border-b border-white/5 bg-[#111111]/40 relative flex">
            {/* Header metadata label on sidebar col */}
            <div className="sticky left-0 top-0 bottom-0 w-36 bg-[#111111] border-r border-[#1c1c1c] flex items-center px-4 z-40 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 font-display tracking-widest uppercase">
                RULER MAP
              </span>
            </div>
            
            <div
              ref={rulerRef}
              onClick={handleScrub}
              className="flex-1 relative cursor-ew-resize z-10 h-full"
            >
              {renderRulerTicks()}
            </div>
          </div>

          {/* TRACK 1: Video Footage and Overlay Elements */}
          <div className="h-20 border-b border-white/5 flex relative group">
            {/* Track control sidebar block - Sticky Pinned */}
            <div className="sticky left-0 w-36 bg-[#0f0f0f] border-r border-white/10 flex items-center justify-between px-4 z-30 shrink-0">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-gray-200 font-display">Video Track</span>
              </div>
              <div className="flex gap-1">
                <Eye className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-pointer" />
                <Lock className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-pointer" />
              </div>
            </div>

            <div className="flex-1 bg-[#050505]/40 relative">
              {/* Visual Beat sync peaks indicator if enabled */}
              {beatsActive && (
                <div className="absolute inset-x-0 bottom-0 top-0 flex justify-around items-end opacity-20 pointer-events-none z-10 px-4">
                  {[...Array(24)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-violet-500 rounded-t-sm" 
                      style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                  ))}
                </div>
              )}

              {clips
                .filter((c) => c.type === 'video' || c.type === 'image')
                .map((clip) => {
                  const isSelected = selectedClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => onSelectClip(clip)}
                      className={`absolute h-14 top-3 rounded-lg border cursor-pointer overflow-hidden flex flex-col justify-center px-3 select-none transition-all ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500 ring-2 ring-violet-500/10 shadow-md shadow-violet-500/5'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      style={{
                        left: `${getPercent(clip.start)}%`,
                        width: `${getPercent(clip.duration)}%`,
                      }}
                    >
                      <div className="flex items-center justify-between relative mt-0.5 z-20">
                        <span className="text-xs font-semibold truncate text-white max-w-[85%] font-sans">
                          {clip.title}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 font-medium">
                          {(clip.duration).toFixed(1)}s
                        </span>
                      </div>

                      {/* Left/Right handle indicators */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/10 pointer-events-none" />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* TRACK 2: AI Narrative Captions (Subtitles) */}
          <div className="h-16 border-b border-white/5 flex relative">
            <div className="sticky left-0 w-36 bg-[#0f0f0f] border-r border-white/10 flex items-center justify-between px-4 z-30 shrink-0">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-gray-200 font-display">AI Subtitles</span>
              </div>
              <Eye className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-pointer" />
            </div>

            <div className="flex-1 bg-[#050505]/40 relative overflow-hidden">
              {captions.map((cap, index) => {
                const active = playhead >= cap.start && playhead <= cap.end;
                return (
                  <div
                    key={index}
                    className={`absolute h-9 top-3.5 rounded-md border text-[10px] font-sans flex items-center px-2 shadow truncate select-none transition ${
                      active
                        ? 'bg-violet-500/20 border-violet-400/60 text-violet-300 font-extrabold text-xs z-10'
                        : 'bg-white/5 border border-white/5 text-gray-400'
                    }`}
                    style={{
                      left: `${getPercent(cap.start)}%`,
                      width: `${getPercent(cap.end - cap.start)}%`,
                    }}
                    title={cap.text}
                  >
                    📝 {cap.text}
                  </div>
                );
              })}

              {captions.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-sans font-medium text-gray-650 uppercase tracking-widest leading-none">
                    AI CAPTIONS EMPTY — USE THE GEMINI TOOL TO GENERATE TIMED MARKERS
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TRACK 3: Ambient Beats & FX Soundtracks */}
          <div className="h-16 flex relative">
            <div className="sticky left-0 w-36 bg-[#0f0f0f] border-r border-white/10 flex items-center justify-between px-4 z-30 shrink-0">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-gray-200 font-display">SFX / Dubs</span>
              </div>
              <VolumeX className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-pointer" />
            </div>

            <div className="flex-1 bg-[#050505]/40 relative overflow-hidden">
              {clips
                .filter((c) => c.type === 'audio')
                .map((clip) => {
                  const isSelected = selectedClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => onSelectClip(clip)}
                      className={`absolute h-10 top-3 rounded-md border cursor-pointer flex items-center justify-between px-3 select-none transition ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-400'
                          : 'bg-white/5 border border-white/5 hover:bg-white/10'
                      }`}
                      style={{
                        left: `${getPercent(clip.start)}%`,
                        width: `${getPercent(clip.duration)}%`,
                      }}
                    >
                      <div className="flex items-center gap-1 truncate text-xs text-blue-300 font-semibold font-sans">
                        <span>🎵 {clip.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-blue-400">{(clip.duration).toFixed(1)}s</span>
                    </div>
                  );
                })}

              {clips.filter((c) => c.type === 'audio').length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-sans font-medium text-gray-650 uppercase tracking-widest leading-none">
                    AUDIO AND SOUND CLIPS EMPTY
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrub instructions helper */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500 font-sans select-none">
        <div className="flex items-center gap-1 leading-none">
          <ArrowDownWideNarrow className="w-3.5 h-3.5 text-gray-600" />
          <span>Scrubbing guide: click and slide over the ruler bar to move playhead precisely across timed scenes.</span>
        </div>
        <div className="hidden sm:block text-zinc-600 font-mono">
          Zoom to inspect millisecond transient edits
        </div>
      </div>
    </div>
  );
}
