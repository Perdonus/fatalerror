import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

function clamp(value: number) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function useScrollSceneProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { current: 0, target: 0 };

    const animate = () => {
      frame = 0;
      state.current += (state.target - state.current) * 0.14;
      const next = Math.abs(state.current - state.target) < 0.0015 ? state.target : state.current;
      setProgress((current) => (Math.abs(current - next) < 0.001 ? current : next));
      if (Math.abs(next - state.target) >= 0.0015) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const updateTarget = () => {
      const node = ref.current;
      if (!node) {
        return;
      }

      if (reducedMotion) {
        setProgress(1);
        return;
      }

      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const total = rect.height + viewport;
      state.target = clamp((viewport - rect.top) / total);
      if (!frame) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const requestUpdate = () => {
      updateTarget();
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  const style = useMemo(() => {
    const eased = progress * progress * (3 - 2 * progress);
    const depth = 1 - Math.abs(eased - 0.5) * 2;
    const pulse = Math.sin(eased * Math.PI);
    const shiftX = (eased - 0.5) * 54;
    const shiftY = (1 - eased) * 80;
    const orbit = Math.sin(eased * Math.PI * 1.65);
    const tilt = (eased - 0.5) * 9;
    const beam = 0.2 + depth * 0.8;
    return {
      '--scene-progress': progress,
      '--scene-progress-eased': eased,
      '--scene-depth': depth,
      '--scene-pulse': pulse,
      '--scene-shift-x': shiftX,
      '--scene-shift-y': shiftY,
      '--scene-orbit': orbit,
      '--scene-tilt': tilt,
      '--scene-beam': beam
    } as CSSProperties;
  }, [progress]);

  return { ref, progress, style };
}
