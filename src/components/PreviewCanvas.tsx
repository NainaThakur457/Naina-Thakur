/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Square, Volume2, Maximize2, Share2, Crop, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrackClip, CaptionEntry } from '../types';
import { LUT_PRESETS } from '../utils/constants';

interface PreviewCanvasProps {
  activeClip: TrackClip | null;
  playhead: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  aspectRatio: string; // '16:9' | '9:16' | '1:1' | '2.35:1'
  captions: CaptionEntry[];
  speedMultiplier: number;
}

export default function PreviewCanvas({
  activeClip,
  playhead,
  isPlaying,
  onTogglePlay,
  aspectRatio,
  captions,
  speedMultiplier,
}: PreviewCanvasProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chromaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Sync Video currentTime with playhead, scaling with Speed multiplier
  useEffect(() => {
    if (!videoRef.current || !activeClip) return;
    
    // Check if the video URL is valid and handles source offset
    const targetVideoTime = (playhead % activeClip.duration) * speedMultiplier;
    
    // Prevent aggressive cursor syncing when video is playing naturally
    if (Math.abs(videoRef.current.currentTime - targetVideoTime) > 0.3) {
      videoRef.current.currentTime = targetVideoTime;
    }
  }, [playhead, activeClip, speedMultiplier]);

  // Handle HTML5 play/pause trigger
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play().catch((err) => {
        // Handle browser autoplay restriction gracefully
        console.warn('Playback block:', err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Chroma Key live rendering effect
  useEffect(() => {
    let active = true;
    let animId: number;

    const renderLoop = () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = chromaCanvasRef.current;

      if (video && canvas && activeClip && activeClip.chromaKey) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 360;
          
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          ctx.drawImage(video, 0, 0, w, h);

          try {
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            const threshold = (activeClip.chromaKeyThreshold ?? 45) * 1.5;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Green detection
              if (g > 65 && g > r * 1.1 && g > b * 1.1) {
                // simple chroma distance matching green
                const dist = Math.sqrt(Math.pow(r - 0, 2) + Math.pow(g - 210, 2) + Math.pow(b - 0, 2));
                if (dist < threshold + 120) {
                  data[i + 3] = 0; // Set Alpha transparent
                }
              }
            }
            ctx.putImageData(imgData, 0, 0);
          } catch (e) {
            // cross origin security fallback
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    if (activeClip?.chromaKey) {
      renderLoop();
    }

    return () => {
      active = false;
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, activeClip, playhead]);

  // Find active caption block corresponding to the current timeline playhead time
  const currentCaption = captions.find(
    (c) => playhead >= c.start && playhead <= c.end
  );

  // Get current Aspect Ratio Tailwind CSS wrapper
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[500px] w-auto';
      case '1:1':
        return 'aspect-[1/1] max-h-[460px] w-auto';
      case '2.35:1':
        return 'aspect-[2.35/1] w-full';
      case '16:9':
      default:
        return 'aspect-[16/9] w-full';
    }
  };

  // Convert adjustments to dynamic CSS Filter property values
  const getFilterStyle = () => {
    if (!activeClip || !activeClip.adjustments) {
      return {};
    }
    const { exposure, contrast, saturation, hue, temperature } = activeClip.adjustments;
    
    // Fetch base LUT profile style
    let lutStyle = '';
    const selectedLut = activeClip.stylePreset;
    const lutPreset = LUT_PRESETS.find((l) => l.name === selectedLut || l.id === selectedLut);
    if (lutPreset) {
      lutStyle = lutPreset.style;
    }

    // Accumulate adjustments
    const brightnessVal = 100 + exposure * 0.8;
    const contrastVal = 100 + contrast * 0.8;
    const saturateVal = 100 + saturation * 0.8;
    const hueVal = hue * 1.8; // degrees
    
    let filterString = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) hue-rotate(${hueVal}deg)`;
    if (lutStyle) {
      // Append grading offsets to selected LUT style
      filterString = `${filterString} ${lutStyle}`;
    }

    return {
      filter: filterString,
      transition: 'filter 0.15s ease-out',
    };
  };

  // Subtitle styling matching custom dynamic styles
  const getSubStyleClass = (style: string) => {
    switch (style) {
      case 'glow-yellow':
        return 'bg-black/85 text-yellow-300 border-2 border-yellow-400 font-extrabold px-4 py-1.5 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.5)]';
      case 'gradient-pink':
        return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] tracking-wide';
      case 'highlight-cyan':
        return 'bg-cyan-500 text-black font-black uppercase tracking-wider px-4 py-1.5 rounded-md shadow-lg scale-105';
      case 'cyber-green':
        return 'bg-zinc-950 text-emerald-400 border border-emerald-500/50 font-mono text-xs tracking-widest uppercase px-3 py-1.5 rounded-sm';
      case 'white':
      default:
        return 'bg-neutral-900/90 text-white font-semibold px-4 py-1.5 rounded';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#111111]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-300 font-display tracking-widest uppercase">
            LIVE CANVAS PREVIEW
          </span>
          <span className="text-[10px] bg-violet-600/10 border border-violet-500/20 text-violet-400 px-2.5 py-0.5 rounded font-mono font-medium">
            GPU {Math.round(speedMultiplier * 60)}FPS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 font-mono mr-2">
            REFRAME MODE: <strong className="text-violet-400 font-sans">{aspectRatio}</strong>
          </span>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
            <Crop className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main stage workspace screen */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden"
      >
        <div 
          id="canvas-scaler" 
          className={`relative overflow-hidden bg-black shadow-[0_25px_50px_-12px_rgba(0,0,0,0.95)] border border-white/10 rounded-sm ring-1 ring-white/10 transition-all duration-300 ${getAspectClass()}`}
        >
          {activeClip ? (
            <>
              {activeClip.type === 'video' ? (
                <>
                  <video
                    ref={videoRef}
                    src={activeClip.url}
                    autoPlay={isPlaying}
                    loop
                    muted
                    playsInline
                    style={activeClip.chromaKey ? { display: 'none' } : getFilterStyle()}
                    onError={() => setVideoError('Playback load error')}
                    className="w-full h-full object-cover"
                  />
                  {activeClip.chromaKey && (
                    <canvas
                      ref={chromaCanvasRef}
                      style={getFilterStyle()}
                      className="w-full h-full object-cover"
                    />
                  )}
                </>
              ) : (
                <img
                  src={activeClip.url}
                  alt={activeClip.title}
                  style={getFilterStyle()}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Subtitles Overlay Layer */}
              <AnimatePresence mode="wait">
                {currentCaption && (
                  <motion.div
                    key={currentCaption.text}
                    initial={{ scale: 0.85, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -10 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="absolute bottom-10 left-0 right-0 flex justify-center px-6 z-30"
                  >
                    <span className={getSubStyleClass(currentCaption.style)}>
                      {currentCaption.text}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transition Simulation Visual Indicator */}
              {isPlaying && (playhead % 5 < 0.8) && activeClip.transitionIn && activeClip.transitionIn !== 'none' && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-white z-20 pointer-events-none"
                  style={{
                    backdropFilter: activeClip.transitionIn === 'blur' ? 'blur(20px)' : 'none'
                  }}
                />
              )}

              {/* Watermark brand overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-60 pointer-events-none">
                <span className="text-[9px] font-mono tracking-widest text-violet-300 uppercase bg-black/80 px-2 py-0.5 rounded-sm border border-white/5">
                  ⚡ CAPCLIP NEBULA PROV4
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#050505]">
              <div className="p-4 bg-[#111111] border border-white/10 rounded-2xl mb-4 text-gray-400 shadow-xl">
                <AlertCircle className="w-8 h-8 mx-auto stroke-[1.5] text-violet-400 animate-pulse" />
              </div>
              <h3 className="text-gray-200 font-display font-medium text-sm tracking-wide">
                No Media Clip Selected
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                Pick a professional cinematic sample footage from the assets library to begin tailoring overlays & applying adjustments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Playback controller status panel */}
      <div className="px-5 py-4 border-t border-white/10 bg-[#111111]/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            id="play-pause-btn"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-600/20 active:scale-95 transition hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-white" />
            ) : (
              <Play className="w-4 h-4 fill-current text-white ml-0.5" />
            )}
          </button>
          
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-violet-400 tracking-wider">
              00:00:{Math.floor(playhead).toString().padStart(2, '0')}:{(Math.floor((playhead % 1) * 30)).toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider">
              CURRENT SCENE TIMECODE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick specs tag */}
          {activeClip && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#050505] border border-white/10 rounded-lg text-[10px] font-mono text-gray-400">
              <span>LUT: <strong className="text-violet-400">{activeClip.stylePreset || 'REC.709'}</strong></span>
              <span className="text-white/10">|</span>
              <span>Speed: <strong className="text-blue-400">{speedMultiplier}x</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-gray-400">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input 
              type="range" 
              min="0" 
              max="100" 
              defaultValue="80" 
              className="w-16 h-1 bg-[#050505] border border-white/5 rounded-full accent-violet-500 appearance-none cursor-pointer"
            />
          </div>

          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
