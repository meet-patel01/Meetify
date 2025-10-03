
import type { BackgroundOption, FilterOption } from "@/components/VirtualBackgroundSelector";

export class VideoEffectsProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private outputStream: MediaStream | null = null;
  private animationId: number | null = null;
  private currentBackground: BackgroundOption = { id: 'none', name: 'None', type: 'none' };
  private currentFilter: FilterOption = { id: 'none', name: 'None', type: 'none' };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async processStream(
    inputStream: MediaStream,
    background: BackgroundOption,
    filter: FilterOption
  ): Promise<MediaStream> {
    this.currentBackground = background;
    this.currentFilter = filter;

    const video = document.createElement('video');
    video.srcObject = inputStream;
    video.play();

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        this.canvas.width = video.videoWidth || 640;
        this.canvas.height = video.videoHeight || 480;
        resolve(void 0);
      };
    });

    if (this.outputStream) {
      this.outputStream.getTracks().forEach(track => track.stop());
    }

    this.outputStream = this.canvas.captureStream(30);

    const processFrame = () => {
      if (video.readyState >= 2) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply background effects
        this.applyBackground(video);
        
        // Apply filter effects
        this.applyFilter();
      }
      this.animationId = requestAnimationFrame(processFrame);
    };

    processFrame();
    return this.outputStream;
  }

  private applyBackground(video: HTMLVideoElement) {
    this.ctx.save();

    switch (this.currentBackground.type) {
      case 'none':
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        break;
        
      case 'blur':
        this.ctx.filter = `blur(${this.currentBackground.blurAmount || 5}px)`;
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the person (simulated by drawing the center area without blur)
        this.ctx.filter = 'none';
        const personWidth = this.canvas.width * 0.4;
        const personHeight = this.canvas.height * 0.6;
        const personX = (this.canvas.width - personWidth) / 2;
        const personY = (this.canvas.height - personHeight) / 2;
        
        this.ctx.drawImage(
          video,
          personX, personY, personWidth, personHeight,
          personX, personY, personWidth, personHeight
        );
        break;
        
      case 'image':
        // Create a simple colored background based on the background type
        const bgColor = this.getBackgroundColor(this.currentBackground.id);
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add some pattern or gradient for the background
        this.addBackgroundPattern(this.currentBackground.id);
        
        // Draw the person (simulated by drawing a center oval)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(
          this.canvas.width / 2,
          this.canvas.height / 2,
          this.canvas.width * 0.25,
          this.canvas.height * 0.35,
          0, 0, 2 * Math.PI
        );
        this.ctx.clip();
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        break;
    }

    this.ctx.restore();
  }

  private applyFilter() {
    if (this.currentFilter.type === 'none') return;

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    switch (this.currentFilter.type) {
      case 'brightness':
        const brightness = (this.currentFilter.intensity || 1.2) * 255;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] + (brightness - 255));
          data[i + 1] = Math.min(255, data[i + 1] + (brightness - 255));
          data[i + 2] = Math.min(255, data[i + 2] + (brightness - 255));
        }
        break;

      case 'contrast':
        const contrast = this.currentFilter.intensity || 1.3;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
        break;

      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;

      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1 + 20);
          data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 10);
          data[i + 2] = Math.min(255, data[i + 2] * 0.8);
        }
        break;

      case 'cool':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.8);
          data[i + 1] = Math.min(255, data[i + 1] * 1.0);
          data[i + 2] = Math.min(255, data[i + 2] * 1.2);
        }
        break;
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  private getBackgroundColor(backgroundId: string): string {
    const colors: Record<string, string> = {
      office: '#f0f4f8',
      library: '#8b4513',
      home: '#f5f5dc',
      nature: '#228b22',
      space: '#000011',
      classroom: '#fffacd',
    };
    return colors[backgroundId] || '#ffffff';
  }

  private addBackgroundPattern(backgroundId: string) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;
    
    switch (backgroundId) {
      case 'office':
        // Simple grid pattern for office
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 50) {
          this.ctx.beginPath();
          this.ctx.moveTo(i, 0);
          this.ctx.lineTo(i, this.canvas.height);
          this.ctx.stroke();
        }
        break;
        
      case 'nature':
        // Simple gradient for nature
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#228b22');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        break;
        
      case 'space':
        // Stars for space background
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          this.ctx.fillRect(x, y, 2, 2);
        }
        break;
    }
    
    this.ctx.restore();
  }

  updateBackground(background: BackgroundOption) {
    this.currentBackground = background;
  }

  updateFilter(filter: FilterOption) {
    this.currentFilter = filter;
  }

  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.outputStream) {
      this.outputStream.getTracks().forEach(track => track.stop());
      this.outputStream = null;
    }
  }
}
