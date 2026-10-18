import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) {
      setIsEnabled(false);
      return;
    }
    setIsEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      if (!isVisible) {
        setIsVisible(true);
      }

      const target = e.target as HTMLElement | null;
      if (!target) {
        setIsHovered(false);
        return;
      }

      const interactive =
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]') ||
        target.closest('input:not([type="hidden"])') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[data-cursor]') ||
        target.closest('.cursor-pointer') ||
        target.getAttribute('tabindex') === '0';

      if (interactive) {
        setIsHovered(true);
      } else {
        try {
          const computedCursor = window.getComputedStyle(target).cursor;
          setIsHovered(computedCursor === 'pointer');
        } catch {
          setIsHovered(false);
        }
      }
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsHovered(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cursor-color)] transition-all duration-200 ease-out ${
            isHovered
              ? isPressed
                ? 'w-3 h-3 scale-90'
                : 'w-3.5 h-3.5'
              : isPressed
              ? 'w-1.5 h-1.5 scale-75'
              : 'w-2 h-2'
          }`}
          style={{
            boxShadow: isHovered
              ? '0 0 10px var(--cursor-glow)'
              : '0 0 5px var(--cursor-glow)',
          }}
        />
      </div>
    </div>
  );
};
