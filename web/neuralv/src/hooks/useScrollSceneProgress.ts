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
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    const state = { current: 0, target: 0 };

    const animate = () => {
      frame = 0;
      state.current += (state.target - state.current) * 0.16;
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

      if (reducedMotionQuery.matches || mobileQuery.matches) {
        state.current = 1;
        state.target = 1;
        setProgress(1);
        return;
      }

      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const start = viewport * 0.88;
      const end = -rect.height * 0.34;
      state.target = clamp((start - rect.top) / (start - end));
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
    reducedMotionQuery.addEventListener('change', requestUpdate);
    mobileQuery.addEventListener('change', requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      reducedMotionQuery.removeEventListener('change', requestUpdate);
      mobileQuery.removeEventListener('change', requestUpdate);
    };
  }, []);

  const style = useMemo(() => {
    const eased = progress * progress * (3 - 2 * progress);
    const enter = clamp((eased - 0.04) / 0.96);
    const focus = 1 - Math.abs(eased - 0.5) * 2;
    const depth = 0.22 + focus * 0.78;
    const drift = (eased - 0.5) * 2;
    const rise = (1 - enter) * 58;
    const orbit = Math.sin(eased * Math.PI * 1.4);
    const swing = Math.sin((eased - 0.08) * Math.PI * 1.08);
    const pulse = 0.5 + Math.sin(eased * Math.PI * 2.2 - Math.PI / 6) * 0.5;
    const tilt = drift * 6.5 + orbit * 1.6;
    const beam = clamp((eased - 0.14) / 0.86);
    const flare = 0.18 + focus * 0.82;

    return {
      '--scene-progress': progress,
      '--scene-progress-eased': eased,
      '--scene-enter': enter,
      '--scene-focus': focus,
      '--scene-depth': depth,
      '--scene-drift': drift,
      '--scene-rise': rise,
      '--scene-orbit': orbit,
      '--scene-swing': swing,
      '--scene-pulse': pulse,
      '--scene-tilt': tilt,
      '--scene-beam': beam,
      '--scene-flare': flare
    } as CSSProperties;
  }, [progress]);

  return { ref, progress, style };
}
