"use client";

import React, { useEffect, useRef } from 'react';
import { useAnimation } from '@/provider/AnimationProvider';
import { Button } from './ui/button';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';

const HomeHero = () => {
  const { gsap, isReady } = useAnimation();
  
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isReady || !heroRef.current) return;
    
    // Create a timeline for hero animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    // Animate the title
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      );
    }
    
    // Animate the subtitle
    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      );
    }
    
    // Animate the CTA buttons
    if (ctaRef.current) {
      const ctaButtons = ctaRef.current.children;
      tl.fromTo(
        ctaButtons,
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.4,
          stagger: 0.2
        },
        "-=0.3"
      );
    }
    
    // Animate the stats
    if (statsRef.current) {
      const statItems = statsRef.current.children;
      tl.fromTo(
        statItems,
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.5,
          stagger: 0.15
        },
        "-=0.2"
      );
    }
    
    return () => {
      // Clean up animations
      if (tl) tl.kill();
    };
  }, [isReady, gsap]);
  
  return (
    <div 
      ref={heroRef}
      className="relative py-16 md:py-24 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            ref={titleRef}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gradient-1 py-2"
          >
            Nền tảng học tập trực tuyến hiện đại
          </h1>
          
          <p 
            ref={subtitleRef}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Trải nghiệm học tập tương tác với các khóa học chất lượng cao, 
            được thiết kế bởi các chuyên gia hàng đầu.
          </p>
          
          <div ref={ctaRef} className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="#courses">
              <Button size="lg" className="gradient-1 hover:opacity-90 transition-all duration-300 hover:shadow-lg">
                Khám phá khóa học
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link href="/forum">
              <Button size="lg" variant="outline" className="hover:bg-accent/50 transition-all duration-300">
                Tham gia diễn đàn
              </Button>
            </Link>
          </div>
          
          <div 
            ref={statsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full gradient-1 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">100+ Khóa học</h3>
              <p className="text-muted-foreground">Đa dạng chủ đề và lĩnh vực học tập</p>
            </div>
            
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full gradient-2 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chứng chỉ</h3>
              <p className="text-muted-foreground">Được công nhận bởi các tổ chức uy tín</p>
            </div>
            
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full gradient-3 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cộng đồng</h3>
              <p className="text-muted-foreground">Kết nối với hàng nghìn học viên khác</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
