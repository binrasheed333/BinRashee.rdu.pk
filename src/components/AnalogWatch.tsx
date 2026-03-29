import React, { useEffect, useRef } from 'react';

export const AnalogWatch: React.FC<{ size?: number }> = ({ size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      const now = new Date();
      const radius = size / 2;
      ctx.clearRect(0, 0, size, size);
      
      ctx.save();
      ctx.translate(radius, radius);
      
      // Glass Face
      const grad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI) / 30;
        const isMajor = i % 5 === 0;
        ctx.lineWidth = isMajor ? 3 : 1;
        const start = radius * (isMajor ? 0.85 : 0.9);
        const end = radius * 0.93;
        
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start);
        ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end);
        ctx.stroke();
      }

      // Hands with smooth movement
      const ms = now.getMilliseconds();
      const second = now.getSeconds() + ms / 1000;
      const minute = now.getMinutes() + second / 60;
      const hour = (now.getHours() % 12) + minute / 60;

      // Hour
      drawHand(ctx, hour * Math.PI / 6, radius * 0.5, 6, '#fff');

      // Minute
      drawHand(ctx, minute * Math.PI / 30, radius * 0.75, 4, '#fff');

      // Second
      drawHand(ctx, second * Math.PI / 30, radius * 0.85, 2, '#00f2ff');

      // Center Dot
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#00f2ff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      animationFrameId = requestAnimationFrame(draw);
    };

    const drawHand = (ctx: CanvasRenderingContext2D, pos: number, length: number, width: number, color: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.moveTo(0, 0);
      ctx.rotate(pos);
      ctx.lineTo(0, -length);
      ctx.stroke();
      ctx.restore();
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [size]);

  return <canvas ref={canvasRef} width={size} height={size} className="drop-shadow-2xl" />;
};
