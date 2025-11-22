import { GoogleGenAI } from "@google/genai";
import { extractFramesFromVideo } from "../utils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generatePromptFromVideo = async (videoUrl: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Không tìm thấy API Key. Vui lòng đảm bảo process.env.API_KEY đã được thiết lập.");
  }

  try {
    // Extract frames to "see" the video content
    const base64Frames = await extractFramesFromVideo(videoUrl, 3);

    const imageParts = base64Frames.map(data => ({
      inlineData: {
        data,
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `
      Phân tích các khung hình từ video này. 
      Viết một mô tả hoặc câu nói ngắn gọn, hấp dẫn bằng Tiếng Việt mô tả video này. 
      Nó phải phù hợp để làm lớp phủ video mạng xã hội (TikTok/Shorts/Reels).
      Giữ dưới 20 từ. 
      Không bao gồm dấu ngoặc kép hoặc hashtag.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [...imageParts, { text: prompt }]
      }
    });

    return response.text ? response.text.trim() : "Không thể tạo nội dung.";
  } catch (error) {
    console.error("Lỗi khi tạo prompt:", error);
    throw error;
  }
};

export const refineText = async (currentText: string, style: string): Promise<string> => {
    if (!apiKey) return currentText;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Viết lại văn bản sau theo phong cách "${style}" bằng Tiếng Việt. Giữ cho nó ngắn gọn và ấn tượng cho lớp phủ video: "${currentText}"`
    });

    return response.text ? response.text.replace(/"/g, '').trim() : currentText;
}