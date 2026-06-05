'use client';

import { useEffect, useRef } from 'react';

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let mouse = { x: -1000, y: -1000 };
    const numTailPoints = 15;
    const maxTailLength = 100;
    const maxSegmentLength = maxTailLength / numTailPoints;
    let tailPoints: { x: number; y: number }[] = Array(numTailPoints).fill(0).map(() => ({ x: -1000, y: -1000 }));

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const stars: { x: number; y: number; size: number; alpha: number; speed: number; vx: number; vy: number }[] = [];
    const numStars = 250;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.5 + 0.1,
        vx: 0,
        vy: 0
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const mouseRadius = 150;
      const repulsionForce = 0.5;
      const friction = 0.92;

      // Draw background stars
      stars.forEach((star) => {
        // Mouse repulsion
        if (mouse.x !== -1000) {
          const dx = mouse.x - star.x;
          const dy = mouse.y - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const force = (mouseRadius - dist) / mouseRadius;
            star.vx -= (dx / dist) * force * repulsionForce;
            star.vy -= (dy / dist) * force * repulsionForce;
          }
        }

        // Apply upward drift
        star.vy -= star.speed * 0.1;

        // Apply friction
        star.vx *= friction;
        star.vy *= friction;

        // Restore X towards center drift slowly if pushed far
        star.vx -= star.vx * 0.01;
        star.vy -= (star.vy + star.speed) * 0.05;

        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around screen
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
          star.vx = 0;
          star.vy = 0;
        } else if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      });

      // Physics-based tail update (constrains max length to 50px)
      if (mouse.x !== -1000) {
        if (tailPoints[numTailPoints - 1].x === -1000) {
          tailPoints = Array(numTailPoints).fill(0).map(() => ({ x: mouse.x, y: mouse.y }));
        }
        tailPoints[numTailPoints - 1] = { x: mouse.x, y: mouse.y };
      } else {
        tailPoints[numTailPoints - 1] = { x: -1000, y: -1000 };
      }

      let isVisible = false;
      for (let i = 0; i < numTailPoints - 1; i++) {
        const next = tailPoints[i + 1];
        const curr = tailPoints[i];
        if (curr.x !== -1000 && next.x !== -1000) {
          curr.x += (next.x - curr.x) * 0.4;
          curr.y += (next.y - curr.y) * 0.4;
          isVisible = true;
        } else if (next.x === -1000) {
          curr.x = -1000;
          curr.y = -1000;
        }
      }
      if (tailPoints[numTailPoints - 1].x !== -1000) isVisible = true;

      for (let i = numTailPoints - 2; i >= 0; i--) {
        const next = tailPoints[i + 1];
        const curr = tailPoints[i];
        if (curr.x !== -1000 && next.x !== -1000) {
          const dx = curr.x - next.x;
          const dy = curr.y - next.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxSegmentLength) {
            curr.x = next.x + (dx / dist) * maxSegmentLength;
            curr.y = next.y + (dy / dist) * maxSegmentLength;
          }
        }
      }

      if (isVisible) {
        const validPoints = tailPoints.filter(p => p.x !== -1000);
        
        let totalDist = 0;
        for (let i = 0; i < validPoints.length - 1; i++) {
          totalDist += Math.sqrt(Math.pow(validPoints[i+1].x - validPoints[i].x, 2) + Math.pow(validPoints[i+1].y - validPoints[i].y, 2));
        }

        if (totalDist > 1 && validPoints.length > 1) {
          let smoothed = [...validPoints];
          for (let iteration = 0; iteration < 2; iteration++) {
            const next = [smoothed[0]];
            for (let i = 0; i < smoothed.length - 1; i++) {
              const p0 = smoothed[i];
              const p1 = smoothed[i + 1];
              next.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
              next.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
            }
            next.push(smoothed[smoothed.length - 1]);
            smoothed = next;
          }

          const glowRight = [];
          const glowLeft = [];
          const coreRight = [];
          const coreLeft = [];

          for (let i = 0; i < smoothed.length; i++) {
            const point = smoothed[i];
            let dx = 0, dy = 0;

            if (i === 0) {
              dx = smoothed[1].x - smoothed[0].x;
              dy = smoothed[1].y - smoothed[0].y;
            } else if (i === smoothed.length - 1) {
              dx = smoothed[i].x - smoothed[i - 1].x;
              dy = smoothed[i].y - smoothed[i - 1].y;
            } else {
              dx = smoothed[i + 1].x - smoothed[i - 1].x;
              dy = smoothed[i + 1].y - smoothed[i - 1].y;
            }

            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            const baseRatio = i / (smoothed.length - 1); 
            const taperRatio = Math.pow(baseRatio, 0.5); 

            const glowRadius = taperRatio * 8;
            const coreRadius = taperRatio * 2.5;

            glowRight.push({ x: point.x + nx * glowRadius, y: point.y + ny * glowRadius });
            glowLeft.unshift({ x: point.x - nx * glowRadius, y: point.y - ny * glowRadius });

            coreRight.push({ x: point.x + nx * coreRadius, y: point.y + ny * coreRadius });
            coreLeft.unshift({ x: point.x - nx * coreRadius, y: point.y - ny * coreRadius });
          }

          const head = smoothed[smoothed.length - 1];
          const tail = smoothed[0];

          const glowGradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
          glowGradient.addColorStop(0, 'rgba(167, 139, 250, 0)');
          glowGradient.addColorStop(1, 'rgba(167, 139, 250, 0.6)');

          const coreGradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
          coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          coreGradient.addColorStop(1, 'rgba(255, 255, 255, 1)');

          ctx.beginPath();
          ctx.moveTo(glowRight[0].x, glowRight[0].y);
          for (let i = 1; i < glowRight.length; i++) ctx.lineTo(glowRight[i].x, glowRight[i].y);
          for (let i = 0; i < glowLeft.length; i++) ctx.lineTo(glowLeft[i].x, glowLeft[i].y);
          ctx.closePath();
          ctx.fillStyle = glowGradient;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(coreRight[0].x, coreRight[0].y);
          for (let i = 1; i < coreRight.length; i++) ctx.lineTo(coreRight[i].x, coreRight[i].y);
          for (let i = 0; i < coreLeft.length; i++) ctx.lineTo(coreLeft[i].x, coreLeft[i].y);
          ctx.closePath();
          ctx.fillStyle = coreGradient;
          ctx.fill();
        }

        const headPt = validPoints[validPoints.length - 1];
        if (headPt) {
          ctx.beginPath();
          ctx.arc(headPt.x, headPt.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(headPt.x, headPt.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)' // Night sky gradient
      }}
    />
  );
}
