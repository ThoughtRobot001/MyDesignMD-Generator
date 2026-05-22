import React, { useState } from 'react';
import { Github, ArrowRight, LogIn, Menu, X } from 'lucide-react';

interface NavbarProps {
  onScrollToSection: (sectionId: string) => void;
  onSelectPresetsClick: () => void;
}

export default function Navbar({ onScrollToSection, onSelectPresetsClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-match bg-bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: mydesign.md Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-90 transition-opacity shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="font-geist text-2xl sm:text-3xl font-bold tracking-tight text-text-white">
            mydesign<span className="text-accent-pink">.md</span>
          </span>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => onScrollToSection('features')}
            className="text-sm font-medium text-text-2 hover:text-accent-pink transition-colors cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => onScrollToSection('workspace')}
            className="text-sm font-medium text-text-2 hover:text-accent-pink transition-colors cursor-pointer"
          >
            Workspace
          </button>
          <button 
            onClick={() => onScrollToSection('how-it-works')}
            className="text-sm font-medium text-text-2 hover:text-accent-pink transition-colors cursor-pointer"
          >
            How it Works
          </button>
          <button 
            onClick={() => onScrollToSection('preview')}
            className="text-sm font-medium text-text-2 hover:text-accent-pink transition-colors cursor-pointer"
          >
            Live Demo
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <a
            href="https://github.com/design-md/design-md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 sm:h-9 items-center justify-center rounded-md bg-surf-3 px-2 sm:px-3 text-text-2 hover:bg-surf-4 hover:text-text-white border border-border-match hover:border-border-active transition-all shrink-0"
            title="GitHub Repository"
          >
            <Github size={16} className="sm:mr-2" />
            <span className="text-xs font-mono hidden sm:inline">★ 4.8k repo</span>
          </a>

          <button
            type="button"
            className="hidden sm:flex h-8 sm:h-9 items-center justify-center rounded-md bg-surf-2 px-3 text-xs font-medium text-text-2 hover:bg-surf-3 hover:text-accent-pink border border-border-match hover:border-accent-pink/45 transition-all cursor-pointer shrink-0"
          >
            <LogIn size={14} className="mr-1.5" />
            <span>Sign in</span>
          </button>

          <button
            onClick={onSelectPresetsClick}
            className="flex h-8 sm:h-9 items-center justify-center rounded-md bg-accent-pink text-black px-2.5 sm:px-4 text-[11px] sm:text-xs font-semibold cursor-pointer tracking-wide hover:bg-accent-pink/90 border border-transparent hover:border-border-active transition-all active:scale-95 duration-100 shrink-0"
          >
            <span>Generate<span className="hidden min-[480px]:inline"> mydesign.md</span></span>
            <ArrowRight size={12} className="ml-1 sm:ml-1.5 shrink-0" />
          </button>

          {/* Hamburger Menu Toggle (last on the right) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex md:hidden h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md bg-surf-3 text-text-2 hover:bg-surf-4 hover:text-text-white border border-border-match hover:border-border-active transition-all cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown list */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border-match bg-bg-black/95 backdrop-blur-md px-4 py-3 space-y-1">
          <button 
            onClick={() => {
              onScrollToSection('features');
              setIsMenuOpen(false);
            }}
            className="w-full text-left block py-2 px-3 text-xs font-mono text-text-2 hover:text-accent-pink hover:bg-surf-2 rounded transition-all cursor-pointer"
          >
            _01_ Features
          </button>
          <button 
            onClick={() => {
              onScrollToSection('workspace');
              setIsMenuOpen(false);
            }}
            className="w-full text-left block py-2 px-3 text-xs font-mono text-text-2 hover:text-accent-pink hover:bg-surf-2 rounded transition-all cursor-pointer"
          >
            _02_ Workspace
          </button>
          <button 
            onClick={() => {
              onScrollToSection('how-it-works');
              setIsMenuOpen(false);
            }}
            className="w-full text-left block py-2 px-3 text-xs font-mono text-text-2 hover:text-accent-pink hover:bg-surf-2 rounded transition-all cursor-pointer"
          >
            _03_ How it Works
          </button>
          <button 
            onClick={() => {
              onScrollToSection('preview');
              setIsMenuOpen(false);
            }}
            className="w-full text-left block py-2 px-3 text-xs font-mono text-text-2 hover:text-accent-pink hover:bg-surf-2 rounded transition-all cursor-pointer"
          >
            _04_ Live Demo
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="w-full text-left flex items-center gap-2 py-2 px-3 text-xs font-mono text-text-2 hover:text-accent-pink hover:bg-surf-2 rounded transition-all cursor-pointer"
          >
            <LogIn size={14} />
            Sign in
          </button>
        </div>
      )}
    </nav>
  );
}
