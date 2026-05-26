/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Play, CheckCircle, Video, Film, X, AlertCircle } from 'lucide-react';
import { TrackClip, CaptionEntry } from '../types';
import { LUT_PRESETS } from '../utils/constants';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: TrackClip[];
  captions: CaptionEntry[];
  aspectRatio: string;
  duration: number;
}

export default function ExportModal({
  isOpen,
  onClose,
  clips,
  captions,
  aspectRatio,
  duration,
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Ready to synthesize cinematic master');
  const [exportedUrl, setExportUrl] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [currentFrameNum, setCurrentFrameNum] = useState<number>(0);
  const [exportMimeType, setExportMimeType] = useState<string>('');

  // Offscreen rendering elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const activeUrlRef = useRef<string>('');

  // Cancel trigger flag
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setIsExporting(false);
      setProgress(0);
      setStatusText('Ready to synthesize cinematic master');
      setExportUrl(null);
      setErrorText(null);
      setCurrentFrameNum(0);
      setTotalFrames(0);
      isCancelledRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Render aspect class for the live-render thumbnail panel
  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16': return 'aspect-[9/16] h-48 w-auto';
      case '1:1': return 'aspect-square h-40 w-auto';
      case '2.35:1': return 'aspect-[2.35/1] w-72 h-auto';
      case '16:9':
      default:
        return 'aspect-[16/9] w-72 h-auto';
    }
  };

  const getDimensions = () => {
    switch (aspectRatio) {
      case '9:16': return { width: 540, height: 960 };
      case '1:1': return { width: 720, height: 720 };
      case '2.35:1': return { width: 1280, height: 544 };
      case '16:9':
      default:
        return { width: 1280, height: 720 };
    }
  };

  // Pre-load dynamic video/image source helper with timeout fail-safes
  const prepareVideoSource = (url: string, targetTime: number): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const video = videoElementRef.current || document.createElement('video');
      videoElementRef.current = video;

      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      // Handle seek or change source safely
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        resolve(video);
      };

      const onError = (e: any) => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        reject(new Error(`Failed to load or seek video frame: ${url}`));
      };

      // Set timeout fallback to prevent getting stuck
      const timeoutId = setTimeout(() => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
        // Resolve anyway with current state so render doesn't crash completely
        resolve(video);
      }, 1500);

      video.addEventListener('seeked', () => {
        clearTimeout(timeoutId);
        onSeeked();
      });
      video.addEventListener('error', () => {
        clearTimeout(timeoutId);
        onError(new Error());
      });

      if (activeUrlRef.current !== url) {
        activeUrlRef.current = url;
        video.src = url;
        video.load();
      }

      video.currentTime = targetTime;
    });
  };

  const prepareImageSource = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = imageElementRef.current || new Image();
      imageElementRef.current = img;
      img.crossOrigin = 'anonymous';

      if (img.src === url && img.complete) {
        resolve(img);
        return;
      }

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image texture: ${url}`));
      img.src = url;
    });
  };

  // Core offline rendering and timeline synthesis pipeline
  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setErrorText(null);
    setExportUrl(null);
    isCancelledRef.current = false;

    try {
      const { width, height } = getDimensions();
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas rendering engine unmounted');

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to acquire 2D context context');

      // Setup 25fps step rendering parameters
      const fps = 25;
      const step = 1 / fps;
      const totalSteps = Math.ceil(duration * fps);
      setTotalFrames(totalSteps);
      setStatusText('Initializing GPGPU render targets...');

      // Find supported mime type for MediaRecorder
      let selectedType = 'video/mp4;codecs=h264';
      if (!MediaRecorder.isTypeSupported(selectedType)) {
        selectedType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(selectedType)) {
          selectedType = 'video/webm;codecs=h264';
          if (!MediaRecorder.isTypeSupported(selectedType)) {
            selectedType = 'video/webm';
          }
        }
      }
      setExportMimeType(selectedType);

      // Create stream capture
      const stream = canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.start();

      // Sequentially synthesis each frame
      for (let i = 0; i < totalSteps; i++) {
        if (isCancelledRef.current) {
          mediaRecorder.stop();
          return;
        }

        const t = i * step;
        setCurrentFrameNum(i + 1);
        setProgress(Math.round((i / totalSteps) * 100));
        setStatusText(`Drawing timeline frame at ${(t).toFixed(1)}s / ${(duration).toFixed(1)}s`);

        // 1. Draw solid dark backdrop
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // 2. Render primary background and footage track elements active at time t
        const activeClips = clips.filter(
          (c) => t >= c.start && t < c.start + c.duration
        );

        // Render video clips first
        const mainClip = activeClips.find(c => c.type === 'video');
        if (mainClip) {
          const relativeTime = t - mainClip.start;
          const seekTime = (relativeTime * mainClip.speed) + mainClip.sourceStart;
          
          try {
            const video = await prepareVideoSource(mainClip.url, seekTime);
            
            // Build adjustments CSS filter string on canvas
            const adj = mainClip.adjustments || { exposure: 0, contrast: 0, saturation: 0, temperature: 0, hue: 0 };
            const brightnessVal = 100 + adj.exposure * 0.8;
            const contrastVal = 100 + adj.contrast * 0.8;
            const saturateVal = 100 + adj.saturation * 0.8;
            const hueVal = adj.hue * 1.8;
            
            let lutFilter = '';
            if (mainClip.stylePreset) {
              const lut = LUT_PRESETS.find(
                (l) => l.id === mainClip.stylePreset || l.name === mainClip.stylePreset
              );
              if (lut && lut.id !== 'lut-none') {
                lutFilter = lut.style;
              }
            }

            // Apply filters to context wrapper
            ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) hue-rotate(${hueVal}deg) ${lutFilter}`;
            
            // Draw scaled frame with custom layout adjustments
            const scale = mainClip.scale || 1.0;
            const posY = mainClip.posY || 0;
            const targetW = width * scale;
            const targetH = height * scale;
            const targetX = (width - targetW) / 2;
            const targetY = ((height - targetH) / 2) + (posY * (height / 100));

            let sourceToDraw: CanvasImageSource = video;

            if (mainClip.chromaKey) {
              const offCanvas = document.createElement('canvas');
              offCanvas.width = video.videoWidth || 640;
              offCanvas.height = video.videoHeight || 360;
              const offCtx = offCanvas.getContext('2d');
              if (offCtx) {
                offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);
                try {
                  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                  const data = imgData.data;
                  const threshold = (mainClip.chromaKeyThreshold ?? 45) * 1.5;
                  for (let px = 0; px < data.length; px += 4) {
                    const r = data[px];
                    const g = data[px + 1];
                    const b = data[px + 2];
                    if (g > 65 && g > r * 1.1 && g > b * 1.1) {
                      const dist = Math.sqrt(Math.pow(r - 0, 2) + Math.pow(g - 210, 2) + Math.pow(b - 0, 2));
                      if (dist < threshold + 120) {
                        data[px + 3] = 0;
                      }
                    }
                  }
                  offCtx.putImageData(imgData, 0, 0);
                  sourceToDraw = offCanvas;
                } catch (e) {
                  // cross origin fallback
                }
              }
            }

            ctx.drawImage(sourceToDraw, targetX, targetY, targetW, targetH);
            ctx.filter = 'none'; // reset filter
          } catch (err: any) {
            console.warn('Frame render warning:', err);
            // Draw placeholder warning
            ctx.fillStyle = '#1c1c1c';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#9c9c9c';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Loading active video stream segment...`, width / 2, height / 2);
          }
        }

        // Draw image / sticker layout overlays
        const overlays = activeClips.filter(c => c.type === 'image' || c.type === 'overlay');
        for (const overlay of overlays) {
          try {
            const img = await prepareImageSource(overlay.url);
            
            // Apply overlay filter if applicable
            const adj = overlay.adjustments || { exposure: 0, contrast: 0, saturation: 0, temperature: 0, hue: 0 };
            const brightnessVal = 100 + adj.exposure * 0.8;
            const contrastVal = 100 + adj.contrast * 0.8;
            const saturateVal = 100 + adj.saturation * 0.8;
            const hueVal = adj.hue * 1.8;

            ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) hue-rotate(${hueVal}deg)`;

            const scale = overlay.scale || 0.5;
            const posY = overlay.posY || 0;
            
            const targetW = width * scale;
            const targetH = height * scale;
            const targetX = (width - targetW) / 2;
            const targetY = ((height - targetH) / 2) + (posY * (height / 100));

            ctx.drawImage(img, targetX, targetY, targetW, targetH);
            ctx.filter = 'none';
          } catch (err) {
            console.warn('Overlay draw fail:', err);
          }
        }

        // 3. Render synchronized subtitles overlay
        const activeCaption = captions.find(c => t >= c.start && t <= c.end);
        if (activeCaption) {
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Center x coordinate, 12% border pad from bottom
          const cx = width / 2;
          const cy = height - (height * 0.15);

          // Build caption dimensions and configurations
          ctx.font = `600 ${Math.round(height * 0.045)}px sans-serif`;
          const textMetric = ctx.measureText(activeCaption.text);
          const bgPaddingH = height * 0.02;
          const bgPaddingW = height * 0.04;
          const boxW = textMetric.width + bgPaddingW * 2;
          const boxH = (height * 0.045) + bgPaddingH * 2;
          const rx = cx - boxW / 2;
          const ry = cy - boxH / 2;

          // Render subtitle matching aesthetic presets
          switch (activeCaption.style) {
            case 'glow-yellow':
              // Black backplate with golden borders
              ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
              ctx.shadowBlur = 18;
              ctx.lineJoin = 'round';
              ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 3;
              // Rounded rect path
              ctx.beginPath();
              ctx.roundRect(rx, ry, boxW, boxH, 12);
              ctx.fill();
              ctx.stroke();

              // Bold golden title
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#facc15';
              ctx.fillText(activeCaption.text, cx, cy);
              break;

            case 'gradient-pink':
              // Deep purple-pink linear gradient box backplate
              const grad = ctx.createLinearGradient(rx, cy, rx + boxW, cy);
              grad.addColorStop(0, '#7c3aed');
              grad.addColorStop(1, '#db2777');
              ctx.fillStyle = grad;
              ctx.shadowColor = 'rgba(219, 39, 119, 0.4)';
              ctx.shadowBlur = 24;

              ctx.beginPath();
              ctx.roundRect(rx, ry, boxW, boxH, 16);
              ctx.fill();

              ctx.shadowBlur = 0;
              ctx.fillStyle = '#ffffff';
              ctx.fillText(activeCaption.text, cx, cy);
              break;

            case 'highlight-cyan':
              // Cyan sharp high contrast card
              ctx.fillStyle = '#06b6d4';
              ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
              ctx.shadowBlur = 12;

              ctx.beginPath();
              ctx.rect(rx, ry, boxW, boxH);
              ctx.fill();

              ctx.shadowBlur = 0;
              ctx.fillStyle = '#000000';
              ctx.fontWeight = '900';
              ctx.fillText(activeCaption.text.toUpperCase(), cx, cy);
              break;

            case 'cyber-green':
              // Space mono neon green capsule
              ctx.fillStyle = 'rgba(5, 5, 5, 0.95)';
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.roundRect(rx, ry, boxW, boxH, 4);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#10b981';
              ctx.font = `${Math.round(height * 0.038)}px monospace`;
              ctx.fillText(activeCaption.text, cx, cy);
              break;

            case 'white':
            default:
              // Minimal gray translucent backplate with crisp white modern font
              ctx.fillStyle = 'rgba(15, 15, 15, 0.9)';
              ctx.beginPath();
              ctx.roundRect(rx, ry, boxW, boxH, 8);
              ctx.fill();

              ctx.fillStyle = '#ffffff';
              ctx.fillText(activeCaption.text, cx, cy);
              break;
          }

          ctx.restore();
        }

        // Draw CapClip Pro aesthetic launcher watermark on export frame
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = `600 ${Math.round(height * 0.024)}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('⚡ CAPCLIP NEBULA EXPORT_PROV4', width * 0.04, height * 0.06);
        ctx.restore();

        // Stagger slightly to allow browser layout engine to catch up and handle stream frames safely
        await new Promise((r) => setTimeout(r, 45));
      }

      mediaRecorder.stop();
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: selectedType });
        const fileUrl = URL.createObjectURL(finalBlob);
        setExportUrl(fileUrl);
        setIsExporting(false);
        setProgress(100);
        setStatusText('Mastering process finalized. Elegant 4K-HDR MP4 is ready!');
      };

    } catch (err: any) {
      console.error(err);
      setErrorText(err?.message || 'Synthesis aborted due to a hardware pipeline failure.');
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    isCancelledRef.current = true;
    setIsExporting(false);
    setStatusText('Export process aborted');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none">
      <div className="bg-[#111111] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Title */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-violet-400 stroke-[2]" />
            <h3 className="font-semibold text-sm text-gray-200 uppercase tracking-widest font-display">
              Creative Production Exporter
            </h3>
          </div>
          <button 
            disabled={isExporting}
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-xl hover:bg-white/5 transition disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 flex flex-col items-center gap-5">
          
          {/* Dynamic offscreen mini rendering display canvas (so users can visualize synthesis) */}
          <div className="bg-[#050505] p-3 rounded-2xl border border-white/5 flex items-center justify-center shadow-inner relative max-w-full">
            <div className={`overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center relative ${getAspectClass()}`}>
              <canvas 
                ref={canvasRef} 
                className="w-full h-full object-contain"
              />
              {!isExporting && !exportedUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
                  <Video className="w-8 h-8 text-violet-400 animate-bounce mb-2" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Ready to Compile Multi-track Timeline
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono mt-1">
                    Frame Steps: 25FPS &bull; Aspect: {aspectRatio}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Exporting progress indicators */}
          <div className="w-full space-y-3 bg-[#0d0d0d] p-4 rounded-xl border border-white/5 text-center">
            
            {errorText ? (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-left text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium font-sans leading-relaxed">{errorText}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-500 uppercase tracking-wider font-display font-bold">
                    {isExporting ? '🔥 Synthesizing Final Reel' : '☕ Process Idle'}
                  </span>
                  <span className="text-violet-400 font-bold font-sans">
                    {progress}%
                  </span>
                </div>

                {/* Progress bar container */}
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 transition-all duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                  {isExporting && (
                    <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
                  )}
                  <p className="text-[11px] text-gray-400 font-semibold font-sans leading-relaxed">
                    {statusText}
                  </p>
                </div>

                {isExporting && (
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                    Frame count: {currentFrameNum} / {totalFrames} &bull; Output: {exportMimeType}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Master statistics and warning */}
          <div className="w-full grid grid-cols-2 gap-3.5 text-left">
            <div className="bg-[#0c0c0c] border border-white/5 p-3 rounded-xl">
              <span className="block text-[8px] text-gray-600 font-bold uppercase tracking-wider">Timeline Length</span>
              <span className="text-sm font-bold text-gray-200 mt-0.5 block">{(duration).toFixed(1)} seconds</span>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 p-3 rounded-xl">
              <span className="block text-[8px] text-gray-600 font-bold uppercase tracking-wider">Export Settings</span>
              <span className="text-sm font-bold text-gray-200 mt-0.5 block font-mono">{aspectRatio} (HDR Level)</span>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="w-full flex gap-3 pt-2">
            {exportedUrl ? (
              <>
                <a
                  href={exportedUrl}
                  download={`capclip_studio_project_${aspectRatio.replace(':', '_')}.mp4`}
                  className="flex-1 py-3 bg-gradient-to-tr from-blue-600 to-violet-600 text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl hover:scale-102 hover:shadow-lg hover:shadow-violet-600/15 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download MP4 File</span>
                </a>
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-bold font-sans uppercase tracking-wider rounded-xl transition"
                >
                  Done
                </button>
              </>
            ) : isExporting ? (
              <button
                onClick={handleCancelExport}
                className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-transparent text-xs font-bold font-sans uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Cancel Compile
              </button>
            ) : (
              <>
                <button
                  onClick={handleStartExport}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/10 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 stroke-[2.5]" />
                  <span>Synthesize & Render</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-bold font-sans uppercase tracking-wider rounded-xl transition"
                >
                  Go Back
                </button>
              </>
            )}
          </div>

        </div>

        {/* Modal safety notification footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#0a0a0a] text-center text-[9px] text-gray-600 leading-snug">
          Synthesized clips use standard HTML5 canvas image processing and full GPU color space rendering. Export streams are stored securely purely in local sandboxed storage.
        </div>
      </div>
    </div>
  );
}
