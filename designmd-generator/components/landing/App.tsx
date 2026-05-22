"use client";

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputWorkspace from './components/InputWorkspace';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import LiveOutput from './components/LiveOutput';
import SocialProof from './components/SocialProof';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

import { SAMPLE_PRESETS } from './data';
import { GeneratedDocument, SamplePreset } from './types';
import { 
  Play, 
  X, 
  Sparkles, 
  Tv, 
  CheckCircle,
  FileCheck 
} from 'lucide-react';

export default function App() {
  const [activePreset, setActivePreset] = useState<SamplePreset>(SAMPLE_PRESETS[0]);
  const [activeDocument, setActiveDocument] = useState<GeneratedDocument>(SAMPLE_PRESETS[0].doc);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoState, setDemoState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [activeStep, setActiveStep] = useState(0);

  // Smooth scroll helper
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Callback when user generates doc
  const handleGenerateDoc = (document: GeneratedDocument, preset?: SamplePreset, shouldFocusPreview = false) => {
    if (preset) {
      setActivePreset(preset);
    }

    setActiveDocument(document);
    if (shouldFocusPreview) {
      setTimeout(() => {
        scrollToSection('preview');
      }, 100);
    }
  };

  // Demo play step helper
  const demoSteps = [
    { text: '[01] Initializing Claude system stream...', duration: 1200 },
    { text: '[02] Fetching source Figma coordinate frames...', duration: 1500 },
    { text: '[03] Isolating neutral black surface ladders...', duration: 1100 },
    { text: '[04] Standardizing font size ratios to rem scales...', duration: 1400 },
    { text: '[05] Output completed! DESIGN.md schema rendered.', duration: 500 }
  ];

  const handleStartDemo = () => {
    setDemoState('PLAYING');
    setActiveStep(0);
    
    // Simulate multi step simulation
    let currentStep = 0;
    const runStep = () => {
      if (currentStep < demoSteps.length - 1) {
        setTimeout(() => {
          currentStep += 1;
          setActiveStep(currentStep);
          runStep();
        }, demoSteps[currentStep].duration);
      } else {
        setTimeout(() => {
          setDemoState('FINISHED');
        }, 1000);
      }
    };
    runStep();
  };

  return (
    <div className="relative min-h-screen bg-bg-black text-text-1 selection:bg-accent-pink selection:text-black font-geist">
      
      {/* 1. Global Navigation header */}
      <Navbar 
        onScrollToSection={scrollToSection} 
        onSelectPresetsClick={() => scrollToSection('workspace')}
      />

      {/* 2. Headline Hero Section */}
      <Hero 
        onCtaclick={() => scrollToSection('workspace')}
        onWatchDemoClick={() => {
          setIsDemoOpen(true);
          handleStartDemo();
        }}
      />

      {/* 3. Input Laboratory Interface Workspace */}
      <InputWorkspace 
        onGenerateDoc={handleGenerateDoc}
        onGenerationStatusChange={setIsGeneratingDocument}
        isLoading={false}
        activePresetId={activePreset.id}
      />

      {/* 4. Timeline Explainer Sequence */}
      <HowItWorks />

      {/* 5. Live Document Spec sheets */}
      <LiveOutput documentData={activeDocument} isGenerating={isGeneratingDocument} />

      {/* 6. Extensive Capabilities grid */}
      <Features />

      {/* 7. Testimonials and endorsements */}
      <SocialProof />

      {/* 8. Bottom CTA panel */}
      <FinalCTA onScrollToWorkspace={() => scrollToSection('workspace')} />

      {/* 9. Global brand legal footer */}
      <Footer />

      {/* === PLAYABLE DEMO MODAL SCREEN OVERLAY === */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-left">
          <div className="relative w-full max-w-2xl bg-surf-1 border border-border-match rounded-lg shadow-2xl overflow-hidden">
            
            {/* Modal Top Bar header */}
            <div className="bg-surf-2 px-5 py-3.5 border-b border-border-match flex items-center justify-between">
              <span className="font-mono text-xs text-accent-pink uppercase tracking-widest flex items-center gap-2">
                <Tv size={14} className="animate-pulse" />
                <span>DESIGN.md Engine Runthrough Video Simulation</span>
              </span>
              <button 
                onClick={() => {
                  setIsDemoOpen(false);
                  setDemoState('IDLE');
                }}
                className="text-text-3 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Demo screen */}
            <div className="p-6 bg-black h-80 relative flex flex-col justify-between items-center overflow-hidden custom-scanlines">
              
              {/* Active scanline visual sweep */}
              <div className="absolute inset-x-0 h-0.5 bg-accent-pink shadow-[0_0_8px_rgba(167,215,210,0.8)] sweep-active" />

              {demoState === 'PLAYING' && (
                <div className="w-full h-full flex flex-col justify-between z-10 text-left font-mono">
                  
                  {/* Step listings with state indicators */}
                  <div className="space-y-3 mt-4">
                    {demoSteps.map((step, idx) => {
                      const isPast = idx < activeStep;
                      const isActive = idx === activeStep;
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${isPast ? 'text-success-green opacity-90' : isActive ? 'text-accent-pink opacity-100' : 'text-text-3 opacity-40'}`}
                        >
                          {isPast ? (
                            <CheckCircle size={14} />
                          ) : isActive ? (
                            <span className="h-2 w-2 rounded-full bg-accent-pink animate-ping" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-surf-3" />
                          )}
                          <span>{step.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Micro timeline ticker */}
                  <div className="border-t border-border-match/45 pt-3.5 mt-auto flex justify-between items-center text-[10px] text-text-3">
                    <span>Engine rate: 1.4 Giga-tokens / sec</span>
                    <span className="text-accent-pink animate-pulse">● PARSING FIGMA FRAME AT 60FPS</span>
                  </div>

                </div>
              )}

              {demoState === 'FINISHED' && (
                <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center z-10 animate-fade-in">
                  <div className="h-12 w-12 rounded-full bg-success-green/15 text-success-green flex items-center justify-center border border-success-green/35">
                    <FileCheck size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold font-geist text-text-white uppercase tracking-wide">
                      Extraction Completed successfully!
                    </h4>
                    <p className="font-geist text-xs text-[#A0A0A0] max-w-sm">
                      We have extracted 14 main color swatches, 4 major text sizes, component button specifications, and copyable CSS configurations.
                    </p>
                  </div>
                  
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setIsDemoOpen(false);
                        scrollToSection('workspace');
                      }}
                      className="px-4 py-1.5 bg-accent-pink text-black font-semibold text-xs rounded transition-all cursor-pointer"
                    >
                      Use Sandbox Workspace
                    </button>
                    <button
                      onClick={handleStartDemo}
                      className="px-4 py-1.5 bg-surf-2 border border-border-match text-text-2 hover:text-white text-xs rounded transition-colors cursor-pointer"
                    >
                      Replay Runthrough
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom controller */}
            <div className="bg-surf-2 px-6 py-3 border-t border-border-match flex justify-between items-center text-[10px] font-mono text-text-3">
              <span>DESIGN.md simulator version 1.2</span>
              <span>MIT Standardized licensing</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
