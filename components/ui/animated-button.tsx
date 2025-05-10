"use client";

import React, { useEffect, useRef } from 'react';
import { Button, ButtonProps } from './button';
import { useAnimation } from '@/provider/AnimationProvider';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  animationVariant?: 'hover' | 'pulse' | 'float' | 'none';
  gradientVariant?: 'gradient1' | 'gradient2' | 'gradient3' | 'gradient4' | 'none';
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    children, 
    animationVariant = 'hover', 
    gradientVariant = 'none',
    ...props 
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { gsap, isReady } = useAnimation();
    
    // Combine refs
    const combinedRef = (node: HTMLButtonElement) => {
      // Update the buttonRef
      buttonRef.current = node;
      
      // Update the forwarded ref if it exists
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    };
    
    // Determine gradient class
    const gradientClass = gradientVariant !== 'none' ? gradientVariant : '';
    
    useEffect(() => {
      if (!isReady || !buttonRef.current || animationVariant === 'none') return;
      
      const button = buttonRef.current;
      
      // Create different animations based on the variant
      if (animationVariant === 'hover') {
        // Create hover animation
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
        
        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      } else if (animationVariant === 'pulse') {
        // Create pulse animation
        const timeline = gsap.timeline({ repeat: -1, yoyo: true });
        timeline.to(button, {
          boxShadow: '0 0 15px rgba(var(--primary), 0.7)',
          duration: 1.5,
          ease: 'sine.inOut'
        });
      } else if (animationVariant === 'float') {
        // Create float animation
        const timeline = gsap.timeline({ repeat: -1, yoyo: true });
        timeline.to(button, {
          y: '-5px',
          duration: 2,
          ease: 'sine.inOut'
        });
      }
      
      return () => {
        // Clean up event listeners
        if (animationVariant === 'hover') {
          button.removeEventListener('mouseenter', () => {});
          button.removeEventListener('mouseleave', () => {});
        }
        
        // Kill any active animations
        gsap.killTweensOf(button);
      };
    }, [isReady, gsap, animationVariant]);
    
    return (
      <Button
        ref={combinedRef}
        className={cn(
          'transition-all duration-300',
          gradientClass && gradientClass,
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };
