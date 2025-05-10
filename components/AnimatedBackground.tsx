"use client";

import React, { useEffect, useRef } from 'react';
import { useAnimation } from '@/provider/AnimationProvider';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  className?: string;
  variant?: 'gradient1' | 'gradient2' | 'gradient3' | 'gradient4';
  intensity?: 'light' | 'medium' | 'strong';
  animated?: boolean;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className,
  variant = 'gradient1',
  intensity = 'medium',
  animated = true,
}) => {
  const { gsap, isReady } = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const blobsRef = useRef<HTMLDivElement[]>([]);

  // Define gradient classes based on variant
  const gradientClass = {
    gradient1: 'gradient-1',
    gradient2: 'gradient-2',
    gradient3: 'gradient-3',
    gradient4: 'gradient-4',
  }[variant];

  // Define opacity based on intensity
  const opacityClass = {
    light: 'opacity-20',
    medium: 'opacity-40',
    strong: 'opacity-60',
  }[intensity];

  useEffect(() => {
    if (!isReady || !animated || !containerRef.current) return;

    const blobs = blobsRef.current;
    
    // Create animation for each blob
    blobs.forEach((blob, index) => {
      // Random initial position
      gsap.set(blob, {
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        scale: 0.8 + Math.random() * 0.5,
      });
      
      // Animate each blob with different parameters
      gsap.to(blob, {
        x: `random(-70, 70)`,
        y: `random(-70, 70)`,
        scale: `random(0.8, 1.5)`,
        rotation: `random(-15, 15)`,
        duration: 15 + index * 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
      });
    });

    return () => {
      // Clean up animations
      blobs.forEach((blob) => {
        gsap.killTweensOf(blob);
      });
    };
  }, [isReady, animated, gsap]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'absolute inset-0 overflow-hidden -z-10',
        className
      )}
    >
      {/* Blob 1 */}
      <div
        ref={(el) => el && (blobsRef.current[0] = el)}
        className={cn(
          'absolute w-[40vw] h-[40vw] rounded-full filter blur-3xl',
          gradientClass,
          opacityClass
        )}
        style={{ top: '-10%', left: '-10%' }}
      />
      
      {/* Blob 2 */}
      <div
        ref={(el) => el && (blobsRef.current[1] = el)}
        className={cn(
          'absolute w-[35vw] h-[35vw] rounded-full filter blur-3xl',
          gradientClass,
          opacityClass
        )}
        style={{ bottom: '-5%', right: '-5%' }}
      />
      
      {/* Blob 3 */}
      <div
        ref={(el) => el && (blobsRef.current[2] = el)}
        className={cn(
          'absolute w-[25vw] h-[25vw] rounded-full filter blur-3xl',
          gradientClass,
          opacityClass
        )}
        style={{ top: '30%', right: '20%' }}
      />
    </div>
  );
};

export default AnimatedBackground;
