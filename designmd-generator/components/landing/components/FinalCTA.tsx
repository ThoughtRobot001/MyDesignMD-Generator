import React from 'react';
import { ArrowRight, Github, Sparkles } from 'lucide-react';

interface FinalCTAProps {
  onScrollToWorkspace: () => void;
}

export default function FinalCTA({ onScrollToWorkspace }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden border-b border-border-match bg-bg-black py-20 sm:py-28 custom-dots">
      {/* Background ambient circular overlay lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full bg-accent-pink/5 blur-3xl" />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Sparkle micro badge text */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent-pink/35 bg-accent-pink/10 px-3 py-0.5 text-[11px] font-mono text-accent-pink uppercase tracking-widest">
          <Sparkles size={11} className="animate-pulse" />
          <span>INSTANT EXPLOITS ON EVERY SOURCE</span>
        </div>

        {/* Display Text Title */}
        <h2 className="font-pixel-line text-4xl sm:text-5xl text-text-white tracking-wide uppercase max-w-2xl mx-auto leading-none">
          Start Generating <br /> Better Design Documentation
        </h2>

        {/* Supporting paragraph text */}
        <p className="font-geist text-[#A0A0A0] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          No credit card required. Free forever sandbox accounts with unlimited document conversion pipelines.
        </p>

        {/* Button Row Actions options */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onScrollToWorkspace}
            className="flex h-12 items-center justify-center rounded-md bg-accent-pink text-black px-6 text-sm font-semibold tracking-wide hover:bg-accent-pink/90 border border-transparent hover:border-border-active transition-all active:scale-95 duration-100 cursor-pointer"
          >
            <span>Try It Free</span>
            <ArrowRight size={15} className="ml-2" />
          </button>

          <a
            href="https://github.com/design-md/design-md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-md bg-surf-2 text-text-1 hover:text-text-white px-6 text-sm font-medium hover:bg-surf-3 border border-border-match hover:border-border-active transition-all cursor-pointer"
          >
            <Github size={16} className="mr-2" />
            <span>View GitHub repository</span>
          </a>
        </div>

      </div>
    </section>
  );
}
