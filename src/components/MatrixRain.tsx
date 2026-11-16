import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;
  color?: string;
  darkMode?: boolean;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ 
  opacity = 0.78,
  color = '#22c55e',
  darkMode = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const chars = '0123456789VCG010110010110189012345';
    const fontSize = 15;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -50);
    }

    let lastTime = 0;
    const interval = 40;

    const draw = (time: number) => {
      animationFrameId = requestAnimationFrame(draw);

      if (time - lastTime < interval) return;
      lastTime = time;

      // Adapt trail fade to dark or light mode
      ctx.fillStyle = darkMode ? 'rgba(5, 5, 5, 0.08)' : 'rgba(241, 245, 249, 0.14)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.85) {
          ctx.fillStyle = darkMode ? '#ffffff' : '#0f172a';
          ctx.shadowColor = darkMode ? '#4ade80' : '#10b981';
          ctx.shadowBlur = darkMode ? 10 : 4;
        } else {
          ctx.fillStyle = darkMode ? color : '#059669';
          ctx.shadowColor = darkMode ? '#22c55e' : '#34d399';
          ctx.shadowBlur = darkMode ? 4 : 2;
        }

        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
      style={{ opacity }}
    />
  );
};
