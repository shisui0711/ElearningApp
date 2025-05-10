"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useAnimation } from "@/provider/AnimationProvider";
import { cn } from "@/lib/utils";

const Footer = () => {
  const { gsap, isReady } = useAnimation();
  
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);
  const copyrightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReady && footerRef.current) {
      // Animate footer elements when component mounts
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
      
      gsap.fromTo(
        linksRef.current?.children || [],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
      
      gsap.fromTo(
        socialsRef.current?.children || [],
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.7)" }
      );
      
      gsap.fromTo(
        copyrightRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, delay: 0.6, ease: "power2.out" }
      );
    }
  }, [isReady, gsap]);

  return (
    <footer 
      ref={footerRef}
      className="bg-background border-t border-border mt-auto"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div ref={logoRef} className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-all duration-300">
              <BookOpen className="size-6 text-gradient-1" />
              <span className="text-xl font-bold text-gradient-1">Easy Learn</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Nền tảng học tập trực tuyến hàng đầu, cung cấp các khóa học chất lượng cao với trải nghiệm học tập tương tác.
            </p>
          </div>

          {/* Quick Links */}
          <div ref={linksRef} className="space-y-4">
            <h3 className="font-semibold text-lg">Liên kết nhanh</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link 
                href="/courses" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Khóa học
              </Link>
              <Link 
                href="/forum" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Diễn đàn
              </Link>
              <Link 
                href="/about" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Về chúng tôi
              </Link>
              <Link 
                href="/contact" 
                className="text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Liên hệ
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" />
                <span className="text-sm">support@easylearn.com</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" />
                <span className="text-sm">+84 123 456 789</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="size-4 mt-1" />
                <span className="text-sm">123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Kết nối với chúng tôi</h3>
            <div ref={socialsRef} className="flex space-x-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="size-9 flex-center rounded-full gradient-1 text-white hover:scale-110 transition-transform duration-200"
              >
                <Facebook className="size-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="size-9 flex-center rounded-full gradient-2 text-white hover:scale-110 transition-transform duration-200"
              >
                <Twitter className="size-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="size-9 flex-center rounded-full gradient-3 text-white hover:scale-110 transition-transform duration-200"
              >
                <Instagram className="size-4" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="size-9 flex-center rounded-full gradient-4 text-white hover:scale-110 transition-transform duration-200"
              >
                <Youtube className="size-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div 
          ref={copyrightRef}
          className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground"
        >
          <p>© {new Date().getFullYear()} Easy Learn. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
