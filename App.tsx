import React, { useState, useCallback, useRef } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { Controls } from './components/Controls';
import { VideoState, OverlayConfig, OverlayStyle, VideoPlayerRef } from './types';
import { generatePromptFromVideo } from './services/geminiService';
import { Smartphone, Sparkles, Download, Crop } from 'lucide-react';

const App: React.FC = () => {
  const [videoState, setVideoState] = useState<VideoState>({
    file: null,
    url: null,
    duration: 0,
  });

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    text: "Chuyển đổi video ngang sang dọc ngay lập tức.",
    style: OverlayStyle.Neon,
    isVisible: true,
    positionY: 25,
  });

  const [panX, setPanX] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Export States
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleFileUpload = useCallback((file: File) => {
    if (videoState.url) {
      URL.revokeObjectURL(videoState.url);
    }
    const url = URL.createObjectURL(file);
    setVideoState({
      file,
      url,
      duration: 0,
    });
    // Reset text on new file
    setOverlayConfig(prev => ({ ...prev, text: "Đang phân tích video..." }));
  }, [videoState.url]);

  const handleGeneratePrompt = async () => {
    if (!videoState.url) {
        alert("Vui lòng tải video lên trước.");
        return;
    }
    
    setIsGenerating(true);
    try {
      const generatedText = await generatePromptFromVideo(videoState.url);
      setOverlayConfig(prev => ({
        ...prev,
        text: generatedText,
        isVisible: true
      }));
    } catch (error) {
      console.error("Failed to generate prompt", error);
      setOverlayConfig(prev => ({
        ...prev,
        text: "Không thể tạo prompt bằng AI. Kiểm tra API Key.",
        isVisible: true
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadClick = async () => {
    if (videoPlayerRef.current) {
      await videoPlayerRef.current.exportVideo();
    }
  };

  const handleSmartCropClick = () => {
    setPanX(0); // Simple auto-center for now
    // In a real app, this would use Object Detection API to find the subject center
    alert("Đã tự động căn chỉnh vào giữa khung hình (Smart Center).");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/50">
              <Smartphone size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">
              Verticalize<span className="text-cyan-400">Studio</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
                <Sparkles size={12} className="text-yellow-500" />
                <span>Hỗ trợ bởi Gemini 2.5 Flash</span>
             </div>
             <a 
                href="https://ai.google.dev/gemini-api/docs" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
             >
                Tài liệu
             </a>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-900/30 rounded-2xl border border-slate-800 p-6 overflow-hidden flex flex-col shadow-2xl">
           <Controls 
             onFileUpload={handleFileUpload}
             overlayConfig={overlayConfig}
             setOverlayConfig={setOverlayConfig}
             onGeneratePrompt={handleGeneratePrompt}
             isGenerating={isGenerating}
             panX={panX}
             setPanX={setPanX}
           />
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800/50 relative overflow-hidden gap-6">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          {/* Phone Frame */}
          <div className="relative z-10 h-[75vh] aspect-[9/16] max-h-[700px] shadow-2xl rounded-[2.5rem]">
             <VideoPlayer 
                ref={videoPlayerRef}
                videoState={videoState} 
                overlayConfig={overlayConfig}
                panX={panX}
                onExportStart={() => { setIsExporting(true); setExportProgress(0); }}
                onProgress={setExportProgress}
                onExportComplete={() => { setIsExporting(false); setExportProgress(100); }}
             />
             
             {/* Export Progress Overlay */}
             {isExporting && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 rounded-[2rem] flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                    <h3 className="text-xl font-bold text-white mb-2">Đang xuất video...</h3>
                    <p className="text-cyan-400 font-mono text-2xl">{exportProgress}%</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Vui lòng không đóng trình duyệt. Quá trình sẽ diễn ra theo thời gian thực.</p>
                </div>
             )}
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex gap-4 z-20">
             <button 
                onClick={handleSmartCropClick}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-all font-medium"
             >
                <Crop size={18} />
                <span>Cắt thông minh</span>
             </button>

             <button 
                onClick={handleDownloadClick}
                disabled={!videoState.url || isExporting}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all
                  ${!videoState.url || isExporting 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white hover:shadow-cyan-500/25 hover:scale-105'}
                `}
             >
                <Download size={18} />
                <span>{isExporting ? 'Đang xử lý...' : 'Tải Video Về'}</span>
             </button>
          </div>

        </div>

      </main>
    </div>
  );
};

export default App;