import React, { useRef, useEffect, useState } from 'react';
import { VideoState, OverlayConfig, OverlayStyle } from '../types';
import { Play, Pause, User, Heart, MessageCircle, Share2 } from 'lucide-react';

interface VideoPlayerProps {
  videoState: VideoState;
  overlayConfig: OverlayConfig;
  panX: number; // -50 to 50 (percentage offset)
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoState, overlayConfig, panX }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (videoState.file) {
        videoRef.current.load();
        setIsPlaying(true);
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [videoState.url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Render the Text Overlay based on Style
  const renderOverlay = () => {
    if (!overlayConfig.isVisible || !overlayConfig.text) return null;

    const baseStyle = {
      top: `${overlayConfig.positionY}%`,
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };

    switch (overlayConfig.style) {
      case OverlayStyle.Neon:
        return (
          <div 
            className="absolute z-20 w-full px-6 text-center pointer-events-none"
            style={baseStyle}
          >
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] font-sans tracking-tighter uppercase italic leading-tight">
              {overlayConfig.text}
            </h2>
          </div>
        );
      
      case OverlayStyle.Comment:
        return (
          <div 
            className="absolute z-20 w-[85%] pointer-events-none"
            style={baseStyle}
          >
            <div className="bg-white/95 backdrop-blur-sm text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 flex gap-3 items-start animate-fade-in-up">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 mb-1">@nguoisangtao_gemini · Vừa xong</p>
                <p className="text-sm font-medium leading-snug">{overlayConfig.text}</p>
              </div>
            </div>
          </div>
        );

      case OverlayStyle.Minimal:
        return (
          <div 
            className="absolute z-20 w-full px-8 pointer-events-none"
            style={baseStyle}
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-lg text-center">
               <p className="text-white font-light tracking-widest uppercase text-xs mb-1">Đề bài</p>
               <p className="text-white font-medium text-lg leading-relaxed font-serif italic">"{overlayConfig.text}"</p>
            </div>
          </div>
        );

      case OverlayStyle.Classic:
      default:
        return (
          <div 
            className="absolute z-20 w-full px-4 text-center pointer-events-none"
            style={baseStyle}
          >
            <p className="text-white font-bold text-xl bg-black/60 px-4 py-2 inline-block rounded-lg shadow-lg backdrop-blur-sm">
              {overlayConfig.text}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden shadow-2xl rounded-[2rem] border-[8px] border-slate-800 ring-1 ring-slate-700 group">
      {/* Video Layer - Smart Crop Simulation */}
      {videoState.url ? (
        <video
          ref={videoRef}
          src={videoState.url}
          loop
          playsInline
          className="absolute w-full h-full object-cover transition-all duration-200"
          style={{ objectPosition: `${50 + panX}% center` }}
          onClick={togglePlay}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-500">
            <div className="text-center">
                <p className="text-4xl mb-2">📱</p>
                <p>Tải video lên để xem trước</p>
            </div>
        </div>
      )}

      {/* Overlay Layer */}
      {renderOverlay()}

      {/* Social Mockup Interface (Right Side Buttons) */}
      <div className="absolute right-2 bottom-20 flex flex-col gap-4 z-30 pointer-events-none">
        <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
            </div>
        </div>
        <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center">
                <Heart size={20} className="text-white" />
            </div>
            <span className="text-xs text-white font-bold shadow-black drop-shadow-md">1.2k</span>
        </div>
        <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center">
                <MessageCircle size={20} className="text-white" />
            </div>
            <span className="text-xs text-white font-bold shadow-black drop-shadow-md">84</span>
        </div>
         <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center">
                <Share2 size={20} className="text-white" />
            </div>
            <span className="text-xs text-white font-bold shadow-black drop-shadow-md">Chia sẻ</span>
        </div>
      </div>

      {/* Play/Pause Overlay (appears on hover or when paused) */}
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
        onClick={togglePlay}
      >
        <button className="p-4 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all hover:scale-110">
          {isPlaying ? <Pause size={32} fill="white" className="text-white" /> : <Play size={32} fill="white" className="text-white ml-1" />}
        </button>
      </div>
    </div>
  );
};