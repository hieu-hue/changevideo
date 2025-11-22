/**
 * Extracts frames from a video file at specific intervals.
 * Used to send visual context to Gemini without uploading the entire video file
 * (which can be large and bandwidth heavy for a frontend demo).
 */
export const extractFramesFromVideo = async (videoUrl: string, numFrames: number = 3): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    const frames: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Points to capture: 20%, 50%, 80%
      const timePoints = [duration * 0.2, duration * 0.5, duration * 0.8];

      try {
        for (const time of timePoints) {
          await new Promise<void>((seekResolve) => {
            video.currentTime = time;
            video.onseeked = () => seekResolve();
          });
          
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Compress to jpeg to save tokens
            frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
          }
        }
        resolve(frames);
      } catch (e) {
        reject(e);
      } finally {
        video.remove();
      }
    };

    video.onerror = (e) => reject(e);
  });
};