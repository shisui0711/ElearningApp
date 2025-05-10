"use client";

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { useAnimation } from '@/provider/AnimationProvider';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animationVariant?: 'hover' | 'reveal' | 'float' | 'none';
  gradientBorder?: boolean;
  glassMorphism?: boolean;
  children: React.ReactNode;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    className, 
    children, 
    animationVariant = 'hover',
    gradientBorder = false,
    glassMorphism = false,
    ...props 
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { gsap, isReady } = useAnimation();
    
    // Combine refs
    const combinedRef = (node: HTMLDivElement) => {
      // Update the cardRef
      cardRef.current = node;
      
      // Update the forwarded ref if it exists
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };
    
    useEffect(() => {
      if (!isReady || !cardRef.current || animationVariant === 'none') return;
      
      const card = cardRef.current;
      
      // Create different animations based on the variant
      if (animationVariant === 'hover') {
        // Create hover animation
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -10,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            duration: 0.3,
            ease: 'power2.out'
          });
        });
        
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      } else if (animationVariant === 'reveal') {
        // Create reveal animation on mount
        gsap.fromTo(
          card,
          { 
            y: 50, 
            opacity: 0 
          },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.6, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom-=100',
              toggleActions: 'play none none none'
            }
          }
        );
      } else if (animationVariant === 'float') {
        // Create float animation
        const timeline = gsap.timeline({ repeat: -1, yoyo: true });
        timeline.to(card, {
          y: '-10px',
          duration: 3,
          ease: 'sine.inOut'
        });
      }
      
      return () => {
        // Clean up event listeners
        if (animationVariant === 'hover') {
          card.removeEventListener('mouseenter', () => {});
          card.removeEventListener('mouseleave', () => {});
        }
        
        // Kill any active animations
        gsap.killTweensOf(card);
      };
    }, [isReady, gsap, animationVariant]);
    
    return (
      <Card
        ref={combinedRef}
        className={cn(
          'transition-all duration-300',
          gradientBorder && 'border-2 border-transparent bg-origin-border bg-clip-padding',
          gradientBorder && 'before:absolute before:inset-0 before:-z-10 before:p-[2px] before:rounded-lg before:bg-gradient-to-r before:from-[hsl(var(--gradient-1-start))] before:to-[hsl(var(--gradient-1-end))]',
          glassMorphism && 'glass',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Export the animated card components
export { 
  AnimatedCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
};
