import React, { useState, useCallback } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { Controls } from './components/Controls';
import { VideoState, OverlayConfig, OverlayStyle } from './types';
import { generatePromptFromVideo } from './services/geminiService';
import { Smartphone, Sparkles } from 'lucide-react';

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
    
    // Auto-trigger generic prompt if API key exists (optional, better to let user click)
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
        <div className="lg:col-span-8 xl:col-span-9 flex items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800/50 relative overflow-hidden">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          {/* Phone Frame */}
          <div className="relative z-10 h-[85vh] aspect-[9/16] max-h-[800px] shadow-2xl rounded-[2.5rem]">
             <VideoPlayer 
                videoState={videoState} 
                overlayConfig={overlayConfig}
                panX={panX}
             />
          </div>
          
          {/* Helper Hint */}
          <div className="absolute bottom-6 text-slate-500 text-xs font-medium uppercase tracking-widest opacity-50 pointer-events-none">
             Xem trước dọc 9:16
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;