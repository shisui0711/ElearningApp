"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { BookmarkIcon, BookOpen, MessageSquare, NotebookPen } from "lucide-react";
import SearchInput from "./SearchInput";
import UserButton from "./UserButton";
import { useSession } from "@/provider/SessionProvider";
import { useAnimation } from "@/provider/AnimationProvider";
import { cn } from "@/lib/utils";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

const Header = () => {
  const { user } = useSession();
  const { gsap, isReady } = useAnimation();

  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !headerRef.current) return;

    // Create a timeline for header animations
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Animate the header
    tl.fromTo(
      headerRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    );

    // Animate the logo
    if (logoRef.current) {
      tl.fromTo(
        logoRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4 },
        "-=0.3"
      );
    }

    // Animate nav items
    if (navItemsRef.current) {
      const navItems = navItemsRef.current.children;
      tl.fromTo(
        navItems,
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.1
        },
        "-=0.2"
      );
    }

    // Add scroll animation - using markers for debugging
    const scrollTrigger = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "+=100",
      scrub: true,
      // markers: true, // Uncomment for debugging
      onUpdate: (self) => {
        // Apply styles directly to ensure sticky behavior isn't affected
        if (headerRef.current) {
          const progress = self.progress;
          const shadowIntensity = Math.min(0.1 + (progress * 0.2), 0.3);
          const blurIntensity = Math.min(8 + (progress * 12), 20);

          headerRef.current.style.boxShadow = `0 10px 30px rgba(0, 0, 0, ${shadowIntensity})`;
          headerRef.current.style.backdropFilter = `blur(${blurIntensity}px)`;
          headerRef.current.style.background = `rgba(var(--background), ${0.8 + (progress * 0.15)})`;
        }
      }
    });

    return () => {
      // Clean up animations
      if (tl) tl.kill();
      if (scrollTrigger) scrollTrigger.kill();
    };
  }, [isReady, gsap]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 w-full z-[100] bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-300 will-change-transform"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Link
              ref={logoRef}
              href="/"
              className="flex items-center space-x-2 hover:opacity-90 transition-all duration-300 hover:scale-105"
            >
              <Image src="/images/logo.png" alt="logo" width={32} height={32} />
              <span className="text-xl font-bold text-gradient-1">
                Easy Learn
              </span>
            </Link>
            <SearchInput />
          </div>
          {/* Right */}
          <div ref={navItemsRef} className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/forum"
              prefetch={false}
              className="flex space-x-2 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 md:border md:border-border md:rounded-md md:px-4 md:py-2 hover:bg-accent/50 hover:scale-105"
            >
              <MessageSquare className="size-4" />
              <span className="hidden md:block text-gradient-1">Diễn đàn</span>
            </Link>
            {user.student && (
              <Link
                href="/assignment"
                prefetch={false}
                className="flex space-x-2 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 md:border md:border-border md:rounded-md md:px-4 md:py-2 hover:bg-accent/50 hover:scale-105"
              >
                <NotebookPen className="size-4" />
                <span className="hidden md:block text-gradient-1">Làm bài kiểm tra</span>
              </Link>
            )}
            {user.student && (
                <Link
                  href="/my-courses"
                  prefetch={false}
                  className="flex space-x-2 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 md:border md:border-border md:rounded-md md:px-4 md:py-2 hover:bg-accent/50 hover:scale-105"
                >
                  <BookmarkIcon className="size-4" />
                  <span className="hidden md:block text-gradient-1">Khóa học của tôi</span>
                </Link>
              )}
              {user.teacher && (
                <Link
                  href="/manage-courses"
                  prefetch={false}
                  className="flex space-x-2 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 md:border md:border-border md:rounded-md md:px-4 md:py-2 hover:bg-accent/50 hover:scale-105"
                >
                  <BookmarkIcon className="size-4" />
                  <span className="hidden md:block text-gradient-1">Quản lý khóa học</span>
                </Link>
              )}
            <ThemeToggle />
            {user && <UserButton />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
