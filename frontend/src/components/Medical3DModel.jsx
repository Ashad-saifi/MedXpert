import React, { useEffect, useRef } from 'react';

/**
 * Medical3DModel Component
 * Renders an interactive 3D cartoon Doctor Avatar on a canvas.
 * Avoids browser compatibility issues by using standard arc() and scale() 
 * to render ellipses instead of the modern ctx.ellipse() method.
 */
export default function Medical3DModel() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width && rect.width > 0 ? rect.width : 320;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = width * dpr;
      
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      ctx.scale(dpr, dpr);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${width}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    let blinkTimer = 0;
    let isBlinking = false;

    // Ambient background particles
    const bgCrosses = Array.from({ length: 8 }, () => ({
      x: Math.random() * 320,
      y: Math.random() * 320,
      size: Math.random() * 8 + 6,
      speed: Math.random() * 0.4 + 0.15,
      rotSpeed: Math.random() * 0.02 - 0.01,
      angle: Math.random() * Math.PI,
      opacity: Math.random() * 0.25 + 0.05
    }));

    // Robust ellipse helper function (avoids modern ctx.ellipse compatibility issues)
    const drawEllipse = (x, y, rx, ry, style, isStroke = false, strokeWidth = 1) => {
      ctx.save();
      ctx.beginPath();
      ctx.translate(x, y);
      ctx.scale(rx / ry, 1);
      ctx.arc(0, 0, ry, 0, Math.PI * 2);
      ctx.restore();
      if (isStroke) {
        ctx.strokeStyle = style;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      } else {
        ctx.fillStyle = style;
        ctx.fill();
      }
    };

    const render = () => {
      try {
        const w = (canvas.width / (window.devicePixelRatio || 1)) || 320;
        const h = (canvas.height / (window.devicePixelRatio || 1)) || 320;

        time += 0.025;

        // Eye blink logic
        blinkTimer++;
        if (!isBlinking && blinkTimer > 150) {
          if (Math.random() < 0.15) {
            isBlinking = true;
            blinkTimer = 0;
          }
        }
        if (isBlinking && blinkTimer > 7) {
          isBlinking = false;
          blinkTimer = 0;
        }

        ctx.clearRect(0, 0, w, h);

        // 1. Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
        ctx.lineWidth = 1;
        const gridSpacing = 20;
        for (let x = 0; x < w; x += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // 2. Crosses
        bgCrosses.forEach((c) => {
          c.y -= c.speed;
          c.angle += c.rotSpeed;
          if (c.y < -20) c.y = h + 20;

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          ctx.fillStyle = `rgba(6, 182, 212, ${c.opacity})`;
          
          const bar = c.size / 3;
          ctx.beginPath();
          ctx.rect(-c.size / 2, -bar / 2, c.size, bar);
          ctx.rect(-bar / 2, -c.size / 2, bar, c.size);
          ctx.fill();
          ctx.restore();
        });

        // Mouse offsets
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

        const dx = mouseRef.current.x * 24;
        const dy = mouseRef.current.y * 18;

        const floatY = Math.sin(time) * 5;
        const floatX = Math.cos(time * 0.5) * 2;

        const cx = w / 2 + floatX;
        const cy = h / 2 + 15 + floatY;

        // 3. Cyber Halo Ring
        ctx.save();
        ctx.translate(cx + dx * 0.15, cy - 20 + dy * 0.15);
        ctx.rotate(time * 0.2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 3;
        if (ctx.setLineDash) {
          ctx.setLineDash([10, 20]);
        }
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Body
        drawEllipse(cx, cy + 90, 88, 32, 'rgba(15, 23, 42, 0.4)');

        // Scrub Shirt
        ctx.beginPath();
        ctx.moveTo(cx - 32, cy + 65);
        ctx.lineTo(cx + 32, cy + 65);
        ctx.lineTo(cx, cy + 105);
        ctx.closePath();
        ctx.fillStyle = '#0d9488';
        ctx.fill();

        // Lab Coat Left & Right
        ctx.beginPath();
        ctx.moveTo(cx - 86, cy + 120);
        ctx.bezierCurveTo(cx - 80, cy + 85, cx - 45, cy + 65, cx - 30, cy + 65);
        ctx.lineTo(cx - 8, cy + 120);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 86, cy + 120);
        ctx.bezierCurveTo(cx + 80, cy + 85, cx + 45, cy + 65, cx + 30, cy + 65);
        ctx.lineTo(cx + 8, cy + 120);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Collar Shadows
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy + 65);
        ctx.lineTo(cx - 42, cy + 85);
        ctx.lineTo(cx - 15, cy + 120);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 30, cy + 65);
        ctx.lineTo(cx + 42, cy + 85);
        ctx.lineTo(cx + 15, cy + 120);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();

        // Stethoscope
        ctx.beginPath();
        ctx.arc(cx, cy + 55, 46, 0, Math.PI, false);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 6;
        ctx.stroke();

        const stethL_x = cx - 18 + dx * 0.12;
        const stethL_y = cy + 100 + dy * 0.12;
        ctx.beginPath();
        ctx.arc(stethL_x, stethL_y, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(stethL_x, stethL_y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();

        // Badge
        const badgeX = cx + 32 + dx * 0.15;
        const badgeY = cy + 90 + dy * 0.12;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(badgeX, badgeY, 16, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(badgeX, badgeY + 6, 16, 14);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(badgeX + 2, badgeY + 9, 12, 1.5);
        ctx.fillRect(badgeX + 2, badgeY + 12, 8, 1.5);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(badgeX + 2, badgeY + 15, 3, 3);

        // 5. Neck
        const neckX = cx + dx * 0.22;
        const neckY = cy + 38 + dy * 0.16;
        
        const neckGrad = ctx.createLinearGradient(neckX - 20, neckY, neckX + 20, neckY);
        neckGrad.addColorStop(0, '#f472b6');
        neckGrad.addColorStop(0.4, '#ffe4e6');
        neckGrad.addColorStop(1, '#f472b6');
        drawEllipse(neckX, neckY, 23, 26, neckGrad);
        drawEllipse(neckX, neckY - 14, 18, 9, 'rgba(219, 39, 119, 0.22)');

        // 6. Ears
        const earParallaxX = dx * 0.14;
        const earParallaxY = dy * 0.22;

        const earL_x = cx - 63 + earParallaxX;
        const earL_y = cy - 4 + earParallaxY;
        ctx.beginPath();
        ctx.arc(earL_x, earL_y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#fbcfe8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earL_x + 3, earL_y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f472b6';
        ctx.fill();

        const earR_x = cx + 63 + earParallaxX;
        const earR_y = cy - 4 + earParallaxY;
        ctx.beginPath();
        ctx.arc(earR_x, earR_y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#fbcfe8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earR_x - 3, earR_y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f472b6';
        ctx.fill();

        // 7. Face
        const faceX = cx + dx * 0.38;
        const faceY = cy - 7 + dy * 0.32;

        const faceGrad = ctx.createRadialGradient(faceX - 16, faceY - 18, 5, faceX, faceY, 70);
        faceGrad.addColorStop(0, '#fff5f5');
        faceGrad.addColorStop(0.35, '#ffe4e6');
        faceGrad.addColorStop(0.85, '#fecdd3');
        faceGrad.addColorStop(1, '#fda4af');

        ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
        ctx.shadowBlur = 20;
        drawEllipse(faceX, faceY, 56, 62, faceGrad);
        ctx.shadowBlur = 0;

        // 8. Head mirror & headband
        const headbandY = faceY - 49;
        drawEllipse(faceX, headbandY, 51, 8, '#334155');

        const mirrorX = faceX - 22 + dx * 0.08;
        ctx.beginPath();
        ctx.arc(mirrorX, headbandY - 1, 15, 0, Math.PI * 2);
        const mirrorGrad = ctx.createRadialGradient(mirrorX - 4, headbandY - 5, 2, mirrorX, headbandY, 15);
        mirrorGrad.addColorStop(0, '#ffffff');
        mirrorGrad.addColorStop(0.55, '#cbd5e1');
        mirrorGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = mirrorGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mirrorX - 3, headbandY - 3, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 9. Hair
        const hairX = faceX;
        const hairY = faceY - 10;

        ctx.beginPath();
        ctx.arc(hairX - 48, hairY - 30, 22, 0, Math.PI * 2);
        ctx.arc(hairX + 48, hairY - 30, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#291102';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(hairX - 58, hairY - 43);
        ctx.bezierCurveTo(hairX - 64, hairY - 96, hairX - 6, hairY - 102, hairX + 16, hairY - 76);
        ctx.bezierCurveTo(hairX + 46, hairY - 84, hairX + 56, hairY - 58, hairX + 57, hairY - 36);
        ctx.bezierCurveTo(hairX + 28, hairY - 54, hairX - 28, hairY - 40, hairX - 58, hairY - 43);
        
        const hairGrad = ctx.createLinearGradient(hairX - 20, hairY - 92, hairX + 10, hairY - 38);
        hairGrad.addColorStop(0, '#541f02');
        hairGrad.addColorStop(0.5, '#381300');
        hairGrad.addColorStop(1, '#1c0a00');
        ctx.fillStyle = hairGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(hairX - 35, hairY - 72);
        ctx.bezierCurveTo(hairX - 12, hairY - 80, hairX + 8, hairY - 68, hairX + 24, hairY - 58);
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 10. Eyebrows & Eyes
        const eyesX = faceX + dx * 0.16;
        const eyesY = faceY - 8 + dy * 0.14;

        ctx.beginPath();
        ctx.arc(eyesX - 22, eyesY - 11, 11, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.strokeStyle = '#2d1101';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(eyesX + 22, eyesY - 11, 11, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.strokeStyle = '#2d1101';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        if (isBlinking) {
          ctx.beginPath();
          ctx.moveTo(eyesX - 29, eyesY + 2);
          ctx.lineTo(eyesX - 11, eyesY + 2);
          ctx.moveTo(eyesX + 11, eyesY + 2);
          ctx.lineTo(eyesX + 29, eyesY + 2);
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 4.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(eyesX - 20, eyesY, 9, Math.PI, 0, false);
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(eyesX + 20, eyesY, 9, Math.PI, 0, false);
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(eyesX - 20, eyesY + 4, 2.2, 0, Math.PI * 2);
          ctx.arc(eyesX + 20, eyesY + 4, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }

        // 12. Cheeks
        drawEllipse(eyesX - 34, eyesY + 11, 9, 5, 'rgba(244, 63, 94, 0.38)');
        drawEllipse(eyesX + 34, eyesY + 11, 9, 5, 'rgba(244, 63, 94, 0.38)');

        // 13. Nose
        const noseX = faceX + dx * 0.28;
        const noseY = faceY + 13 + dy * 0.2;
        
        const noseGrad = ctx.createRadialGradient(noseX - 2, noseY - 3, 2, noseX, noseY, 9);
        noseGrad.addColorStop(0, '#fecdd3');
        noseGrad.addColorStop(1, '#f43f5e');
        drawEllipse(noseX, noseY, 8.5, 12, noseGrad);

        // 14. Mouth
        const mouthX = faceX + dx * 0.22;
        const mouthY = faceY + 31 + dy * 0.16;

        const distOffset = Math.min(Math.abs(mouseRef.current.x) + Math.abs(mouseRef.current.y), 1);
        const smileExpansion = distOffset * 3;

        ctx.beginPath();
        ctx.arc(mouthX, mouthY, 17 + smileExpansion, 0, Math.PI, false);
        ctx.closePath();
        ctx.fillStyle = '#4c0519';
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(mouthX, mouthY, 17 + smileExpansion, 0, Math.PI, false);
        ctx.closePath();
        ctx.clip();

        ctx.beginPath();
        ctx.rect(mouthX - 22, mouthY, 44, 5.5);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        drawEllipse(mouthX, mouthY + 14, 12, 8, '#fda4af');
        ctx.restore();

      } catch (err) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Error: ${err.message}`, 10, 50);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    mouseRef.current.targetX = x / (rect.width / 2);
    mouseRef.current.targetY = y / (rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[360px] h-[360px] flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950/80 rounded-3xl border-2 border-cyan-500/25 hover:border-cyan-400/40 shadow-[0_0_35px_rgba(6,182,212,0.15)] overflow-hidden group transition-all duration-300"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.16)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-4 left-4 right-4 bottom-4 rounded-2xl border border-sky-500/10 pointer-events-none group-hover:border-sky-400/25 transition-colors duration-300" />
      
      {/* Glow highlight streak */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Canvas */}
      <canvas ref={canvasRef} className="relative z-10 block cursor-grab active:cursor-grabbing" style={{ width: '320px', height: '320px' }} />

      {/* Telemetry overlays */}
      <div className="absolute top-5 left-5 z-20 font-mono text-[9px] text-sky-400/60 select-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <p className="tracking-widest">DR_BOT_3D // ONLINE</p>
        </div>
        <p className="text-slate-500 font-semibold tracking-wider mt-0.5">TRACKING ACTIVE</p>
      </div>

      <div className="absolute bottom-5 right-5 z-20 font-mono text-[9px] text-orange-400/50 select-none text-right">
        <p className="tracking-wider">ENGINE: RADIAL_PARALLAX</p>
        <p className="text-slate-500">HOVER & INTERACT</p>
      </div>
    </div>
  );
}
