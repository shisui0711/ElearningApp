import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Utility function to create staggered animations
export const staggerElements = (
  elements: HTMLElement[] | NodeListOf<Element>,
  options: {
    fromVars?: gsap.TweenVars;
    toVars: gsap.TweenVars;
    staggerTime?: number;
    delay?: number;
  }
) => {
  const { fromVars, toVars, staggerTime = 0.1, delay = 0 } = options;

  if (fromVars) {
    gsap.set(elements, fromVars);
  }

  return gsap.to(elements, {
    ...toVars,
    stagger: staggerTime,
    delay,
  });
};

// Utility function for text reveal animations
export const revealText = (
  element: HTMLElement,
  options: {
    duration?: number;
    delay?: number;
    ease?: string;
  } = {}
) => {
  const { duration = 0.8, delay = 0, ease = 'power3.out' } = options;

  // Set initial state
  gsap.set(element, {
    opacity: 0,
    y: 20,
  });

  // Animate
  return gsap.to(element, {
    opacity: 1,
    y: 0,
    duration,
    delay,
    ease,
  });
};

// Utility function for fade-in animations
export const fadeIn = (
  element: HTMLElement | HTMLElement[],
  options: {
    duration?: number;
    delay?: number;
    y?: number;
    x?: number;
    ease?: string;
    opacity?: number;
  } = {}
) => {
  const { 
    duration = 0.6, 
    delay = 0, 
    y = 0, 
    x = 0, 
    ease = 'power2.out',
    opacity = 1
  } = options;

  // Set initial state
  gsap.set(element, {
    opacity: 0,
    y: y !== 0 ? y : undefined,
    x: x !== 0 ? x : undefined,
  });

  // Animate
  return gsap.to(element, {
    opacity,
    y: 0,
    x: 0,
    duration,
    delay,
    ease,
  });
};

// Hook for scroll-triggered animations
export const useScrollAnimation = (
  ref: React.RefObject<HTMLElement>,
  options: {
    animation: (element: HTMLElement) => gsap.core.Tween;
    triggerOptions?: ScrollTrigger.Vars;
  }
) => {
  const { animation, triggerOptions } = options;
  
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const tween = animation(element);
    
    const scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: 'top bottom-=100',
      toggleActions: 'play none none none',
      ...triggerOptions,
      animation: tween,
    });
    
    return () => {
      scrollTrigger.kill();
      tween.kill();
    };
  }, [ref, animation, triggerOptions]);
};

// Gradient text animation
export const animateGradientText = (
  element: HTMLElement,
  options: {
    colors: string[];
    duration?: number;
    repeat?: number;
  }
) => {
  const { colors, duration = 3, repeat = -1 } = options;
  
  const colorStops = colors.map((color, index) => {
    const position = (index / (colors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(', ');
  
  gsap.set(element, {
    backgroundImage: `linear-gradient(90deg, ${colorStops})`,
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    textFillColor: 'transparent',
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
  });
  
  return gsap.to(element, {
    backgroundPosition: '100% 0%',
    duration,
    repeat,
    yoyo: true,
    ease: 'none',
  });
};

// Button hover animation
export const buttonHoverAnimation = (button: HTMLElement) => {
  const timeline = gsap.timeline({ paused: true });
  
  timeline.to(button, {
    scale: 1.05,
    duration: 0.3,
    ease: 'power2.out',
  });
  
  button.addEventListener('mouseenter', () => timeline.play());
  button.addEventListener('mouseleave', () => timeline.reverse());
  
  return timeline;
};

// Card hover animation
export const cardHoverAnimation = (card: HTMLElement) => {
  const timeline = gsap.timeline({ paused: true });
  
  timeline.to(card, {
    y: -10,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    duration: 0.3,
    ease: 'power2.out',
  });
  
  card.addEventListener('mouseenter', () => timeline.play());
  card.addEventListener('mouseleave', () => timeline.reverse());
  
  return timeline;
};
