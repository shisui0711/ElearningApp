"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Define the context type
interface AnimationContextType {
  gsap: typeof gsap;
  isReady: boolean;
}

// Create the context with default values
const AnimationContext = createContext<AnimationContextType>({
  gsap,
  isReady: false,
});

// Custom hook to use the animation context
export const useAnimation = () => useContext(AnimationContext);

// Animation Provider component
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Register GSAP plugins
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      
      // Set up any global GSAP configurations
      gsap.config({
        nullTargetWarn: false,
      });
      
      // Mark as ready
      setIsReady(true);
    }
    
    // Clean up on unmount
    return () => {
      if (typeof window !== 'undefined') {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill(false));
        gsap.globalTimeline.clear();
      }
    };
  }, []);

  return (
    <AnimationContext.Provider value={{ gsap, isReady }}>
      {children}
    </AnimationContext.Provider>
  );
}

export default AnimationProvider;
