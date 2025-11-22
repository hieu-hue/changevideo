import React, { useRef } from 'react';
import { OverlayConfig, OverlayStyle } from '../types';
import { Upload, Wand2, Type, Video, AlignCenterHorizontal, Layout, Sparkles, Palette } from 'lucide-react';

interface ControlsProps {
  onFileUpload: (file: File) => void;
  overlayConfig: OverlayConfig;
  setOverlayConfig: React.Dispatch<React.SetStateAction<OverlayConfig>>;
  onGeneratePrompt: () => void;
  isGenerating: boolean;
  panX: number;
  setPanX: (val: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  onFileUpload,
  overlayConfig,
  setOverlayConfig,
  onGeneratePrompt,
  isGenerating,
  panX,
  setPanX
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const styles = [
    { id: OverlayStyle.Classic, label: 'Cổ điển', color: 'bg-slate-700' },
    { id: OverlayStyle.Comment, label: 'Bình luận', color: 'bg-blue-600' },
    { id: OverlayStyle.Neon, label: 'Neon', color: 'bg-fuchsia-600' },
    { id: OverlayStyle.Minimal, label: 'Tối giản', color: 'bg-stone-600' },
  ];

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 pb-20">
      
      {/* 1. Video Source */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <Video size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">1. Video Nguồn</h3>
        </div>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-cyan-500 hover:bg-slate-800/50 transition-all group"
        >
          <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
            <Upload className="text-slate-400 group-hover:text-cyan-400" size={24} />
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-200">Tải lên Video Ngang</p>
            <p className="text-xs text-slate-500 mt-1">MP4, MOV lên tới 50MB</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            className="hidden" 
          />
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* 2. Smart Crop */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Layout size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">2. Cắt Thông Minh (9:16)</h3>
        </div>
        
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1"><AlignCenterHorizontal size={12}/> Sang Trái</span>
            <span className="text-white font-mono">{panX > 0 ? '+' : ''}{panX}%</span>
            <span className="flex items-center gap-1">Sang Phải <AlignCenterHorizontal size={12}/></span>
          </div>
          <input 
            type="range" 
            min="-50" 
            max="50" 
            value={panX} 
            onChange={(e) => setPanX(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
          />
          <p className="text-[10px] text-slate-500 mt-2">Điều chỉnh điểm lấy nét ngang của video.</p>
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* 3. Overlay Content */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 text-green-400">
            <Type size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">3. Prompt / Phụ đề</h3>
          </div>
          <button 
            onClick={onGeneratePrompt}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-1.5 px-3 rounded-full transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
                <Sparkles size={14} className="animate-spin" />
            ) : (
                <Wand2 size={14} />
            )}
            {isGenerating ? 'Đang phân tích...' : 'Tự động tạo'}
          </button>
        </div>

        <textarea 
          value={overlayConfig.text}
          onChange={(e) => setOverlayConfig({...overlayConfig, text: e.target.value})}
          placeholder="Nhập câu lệnh, câu hỏi hoặc bình luận..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none text-sm leading-relaxed transition-all placeholder:text-slate-600"
          rows={3}
        />

        {/* Styles */}
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setOverlayConfig({ ...overlayConfig, style: style.id })}
              className={`
                relative overflow-hidden rounded-lg p-3 flex items-center gap-3 border transition-all
                ${overlayConfig.style === style.id 
                  ? 'border-white/20 bg-white/10 shadow-inner' 
                  : 'border-transparent bg-slate-800/50 hover:bg-slate-800'}
              `}
            >
              <div className={`w-3 h-3 rounded-full ${style.color} shadow-[0_0_8px_currentColor]`}></div>
              <span className={`text-xs font-medium ${overlayConfig.style === style.id ? 'text-white' : 'text-slate-400'}`}>
                {style.label}
              </span>
              {overlayConfig.style === style.id && <div className="absolute inset-0 border-2 border-green-500/30 rounded-lg pointer-events-none" />}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* 4. Positioning */}
      <section className="space-y-4">
         <div className="flex items-center gap-2 text-orange-400 mb-2">
          <Palette size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">4. Vị trí</h3>
        </div>
        
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
           <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Trên</span>
            <span className="text-white font-mono">{overlayConfig.positionY}%</span>
            <span>Dưới</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="90" 
            value={overlayConfig.positionY} 
            onChange={(e) => setOverlayConfig({...overlayConfig, positionY: Number(e.target.value)})}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400"
          />
        </div>

        <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
          <span className="text-sm text-slate-300">Hiện lớp phủ</span>
          <button 
            onClick={() => setOverlayConfig({...overlayConfig, isVisible: !overlayConfig.isVisible})}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${overlayConfig.isVisible ? 'bg-green-500' : 'bg-slate-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${overlayConfig.isVisible ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

    </div>
  );
};