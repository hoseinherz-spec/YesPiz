"use client";

import { CraftTimeline } from "@/dev/yesplz/CraftTimeline";
import { CustomCursor } from "@/dev/yesplz/CustomCursor";
import { FloatingHeader } from "@/dev/yesplz/FloatingHeader";
import { HeroSection } from "@/dev/yesplz/HeroSection";
import { MagneticFooter } from "@/dev/yesplz/MagneticFooter";
import { MenuSlider } from "@/dev/yesplz/MenuSlider";
import { NoiseOverlay } from "@/dev/yesplz/NoiseOverlay";
import { SmoothScroll } from "@/dev/yesplz/SmoothScroll";
import { TestimonialsFaq } from "@/dev/yesplz/TestimonialsFaq";
import { VelocityMarquee } from "@/dev/yesplz/VelocityMarquee";

export default function YesplzLanding() {
  return (
    <SmoothScroll>
      <div className="yesplz-landing relative min-h-screen overflow-x-clip bg-[#080808] text-white">
        <NoiseOverlay />
        <CustomCursor />
        <FloatingHeader />
        <main>
          <HeroSection />
          <CraftTimeline />
          <VelocityMarquee />
          <MenuSlider />
          <TestimonialsFaq />
        </main>
        <MagneticFooter />
      </div>
    </SmoothScroll>
  );
}
