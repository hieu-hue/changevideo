import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { VideoState, OverlayConfig, OverlayStyle, VideoPlayerRef } from '../types';
import { Play, Pause, User, Heart, MessageCircle, Share2 } from 'lucide-react';

interface VideoPlayerProps {
  videoState: VideoState;
  overlayConfig: OverlayConfig;
  panX: number; // -50 to 50 (percentage offset)
  onProgress: (progress: number) => void;
  onExportStart: () => void;
  onExportComplete: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ 
  videoState, 
  overlayConfig, 
  panX,
  onProgress,
  onExportStart,
  onExportComplete
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper: Kiểm tra trình duyệt hỗ trợ định dạng nào, ưu tiên MP4 (H.264)
  const getSupportedMimeType = () => {
    const types = [
      'video/mp4;codecs=avc1.4d401e,mp4a.40.2', // Chuẩn MP4 H.264 (Tốt nhất cho Mobile/Windows)
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264',
      'video/mp4',
      'video/webm;codecs=h264', // WebM nhưng dùng codec H.264
      'video/webm;codecs=vp9',
      'video/webm'
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
  };

  // Expose export function to parent
  useImperativeHandle(ref, () => ({
    exportVideo: async () => {
      if (!videoRef.current || !canvasRef.current || !videoState.url) return;
      
      onExportStart();
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // 1. Xác định định dạng file
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        alert('Trình duyệt của bạn không hỗ trợ ghi video. Vui lòng thử Chrome hoặc Edge mới nhất.');
        onExportComplete();
        return;
      }

      // Kiểm tra xem có phải là mp4 không để đặt đuôi file
      const isMp4 = mimeType.toLowerCase().includes('mp4');
      console.log(`Đang xuất video với định dạng: ${mimeType}`);

      // 2. Cấu hình Recorder
      const stream = canvas.captureStream(30); // 30 FPS
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps cho chất lượng cao
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 3. Đặt tên file theo định dạng
        const extension = isMp4 ? 'mp4' : 'webm';
        a.download = `verticalize_video_${Date.now()}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Reset trạng thái UI
        video.loop = true;
        video.muted = false;
        setIsPlaying(false);
        onExportComplete();
      };

      // 4. Bắt đầu quá trình ghi
      video.pause();
      video.currentTime = 0;
      video.loop = false; // Chạy 1 lần để ghi
      video.muted = true; // Tắt tiếng loa ngoài để tránh feedback (nếu có mic), nhưng stream vẫn có thể xử lý audio nếu cần setup thêm
      
      // Delay nhỏ để đảm bảo seek hoàn tất
      await new Promise(r => setTimeout(r, 200));
      
      mediaRecorder.start();

      // Hàm vẽ frame liên tục
      const drawFrame = () => {
        if (video.paused || video.ended) {
          if (video.ended) {
            mediaRecorder.stop();
            return;
          }
        }

        // Vẽ Video với Crop và Pan
        // Canvas size được set cứng là 1080x1920 (9:16)
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;
        
        // Tính toán tỷ lệ crop để lấp đầy chiều cao (cover)
        const scale = canvas.height / vHeight;
        const scaledWidth = vWidth * scale;
        
        // Tính toán Pan X
        const centerOffset = (scaledWidth - canvas.width) / 2;
        const panOffset = (panX / 50) * centerOffset; 
        
        let sourceX = (centerOffset + panOffset) / scale;
        
        // Giới hạn không cho pan ra ngoài khung hình
        sourceX = Math.max(0, Math.min(sourceX, vWidth - (canvas.width / scale)));

        ctx.drawImage(
          video,
          sourceX, 0, canvas.width / scale, vHeight, // Source crop
          0, 0, canvas.width, canvas.height // Dest
        );

        // Vẽ Overlay (Text) lên Canvas
        if (overlayConfig.isVisible && overlayConfig.text) {
           drawOverlayOnCanvas(ctx, canvas.width, canvas.height);
        }

        // Cập nhật thanh tiến trình
        const percent = Math.round((video.currentTime / video.duration) * 100);
        onProgress(Math.min(percent, 99));

        if (!video.ended) {
          requestAnimationFrame(drawFrame);
        }
      };

      try {
        await video.play();
        drawFrame();
      } catch (err) {
        console.error("Lỗi khi phát video để export:", err);
        mediaRecorder.stop();
        onExportComplete();
      }
    }
  }));

  // Hàm vẽ Text Overlay lên Canvas (mô phỏng CSS style)
  const drawOverlayOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const yPos = (overlayConfig.positionY / 100) * height;
    const text = overlayConfig.text;
    const centerX = width / 2;

    ctx.save();
    
    // Cấu hình chung
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (overlayConfig.style === OverlayStyle.Neon) {
      // Style Neon
      ctx.font = 'italic small-caps 900 80px "Inter", sans-serif';
      ctx.shadowColor = '#22d3ee'; // Cyan glow
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'white';
      
      // Vẽ nhiều lần để tạo hiệu ứng glow mạnh
      ctx.fillText(text, centerX, yPos);
      ctx.fillStyle = '#e879f9'; // Purple tint
      ctx.fillText(text, centerX, yPos);
      
      // Giả lập gradient text
      const gradient = ctx.createLinearGradient(centerX - 200, yPos, centerX + 200, yPos);
      gradient.addColorStop(0, '#22d3ee');
      gradient.addColorStop(1, '#a855f7');
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.fillText(text, centerX, yPos);

    } else if (overlayConfig.style === OverlayStyle.Comment) {
      // Style Bình luận mạng xã hội
      ctx.font = '500 40px "Inter", sans-serif';
      const metrics = ctx.measureText(text);
      const boxWidth = Math.min(width * 0.85, metrics.width + 120);
      const boxHeight = 140; 
      const boxX = centerX - boxWidth / 2;
      const boxY = yPos - boxHeight / 2;

      // Bong bóng chat
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 20;
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Avatar
      const avatarX = boxX + 40;
      const avatarY = boxY + 40;
      const gradient = ctx.createLinearGradient(avatarX, avatarY, avatarX + 40, avatarY + 40);
      gradient.addColorStop(0, '#ec4899');
      gradient.addColorStop(1, '#f97316');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(avatarX + 20, avatarY + 20, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText("AI", avatarX + 20, avatarY + 20);

      // Username
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText("@nguoisangtao_gemini", avatarX + 50, avatarY + 15);
      
      // Nội dung text
      ctx.fillStyle = '#0f172a';
      ctx.font = '500 36px "Inter", sans-serif';
      ctx.fillText(text, avatarX + 50, avatarY + 50, boxWidth - 80);

    } else if (overlayConfig.style === OverlayStyle.Minimal) {
      // Style Tối giản
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.roundRect(centerX - width * 0.45, yPos - 60, width * 0.9, 120, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '300 24px "Inter", sans-serif';
      ctx.fillText("ĐỀ BÀI", centerX, yPos - 25);
      
      ctx.font = 'italic 500 48px "Inter", serif';
      ctx.fillText(`"${text}"`, centerX, yPos + 20);

    } else {
      // Style Cổ điển (Classic)
      ctx.font = 'bold 50px "Inter", sans-serif';
      const metrics = ctx.measureText(text);
      const padding = 30;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = 80;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(centerX - bgWidth / 2, yPos - bgHeight / 2, bgWidth, bgHeight, 15);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.fillText(text, centerX, yPos);
    }

    ctx.restore();
  }

  // --- Logic Render View ---

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

  const renderOverlayHTML = () => {
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
      
      {/* Canvas ẩn để xuất video */}
      <canvas 
        ref={canvasRef} 
        width={1080} 
        height={1920} 
        className="hidden"
      />

      {/* Video View Layer */}
      {videoState.url ? (
        <video
          ref={videoRef}
          src={videoState.url}
          loop
          playsInline
          crossOrigin="anonymous"
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

      {/* Overlay HTML Layer (cho preview) */}
      {renderOverlayHTML()}

      {/* Social Mockup Interface */}
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

      {/* Play/Pause Button */}
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
});

VideoPlayer.displayName = 'VideoPlayer';