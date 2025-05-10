"use client";

import React, { useRef, useEffect } from "react";
import { useAnimation } from "@/provider/AnimationProvider";

const AdminFooter = () => {
  const { gsap, isReady } = useAnimation();
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReady && footerRef.current) {
      gsap.fromTo(
        footerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [isReady, gsap]);

  return (
    <div 
      ref={footerRef}
      className="mt-auto border-t border-border py-4 px-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Easy Learn Admin
        </p>
        <p className="text-xs text-muted-foreground">
          Phiên bản 1.0.0 | Được phát triển bởi Easy Learn Team
        </p>
      </div>
    </div>
  );
};

export default AdminFooter;
