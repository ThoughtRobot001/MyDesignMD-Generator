import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Check, Terminal, FileCode, Layers } from 'lucide-react';

interface HeroProps {
  onCtaclick: () => void;
  onWatchDemoClick: () => void;
}

export default function Hero({ onCtaclick, onWatchDemoClick }: HeroProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'schema' | 'terminal'>('preview');
  const [scanProgress, setScanProgress] = useState(15);
  const [mockLogs, setMockLogs] = useState<string[]>([
    'Initializing Claude 3.5 Sonnet payload...',
    'Warming up regional optical analysis engines...',
    'Awaiting design stream canvas binding...'
  ]);

  // Simulating live AI workflow inside mockup
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          // Add a new mock log
          const newLogs = [
            'Analyzing structural layout coordinates...',
            'Extracting dominant hex token colors...',
            'Parsing component typography metrics...',
            'Comparing AA/AAA accessibility values...',
            'Assembling final markdown structure...',
            'Stream completed. Ready in 450ms.'
          ];
          setMockLogs((prevLogs) => {
            const nextIdx = prevLogs.length % newLogs.length;
            return [...prevLogs.slice(-4), newLogs[nextIdx]];
          });
          return 12;
        }
        return prev + 8;
      });
    }, 1500);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-border-match bg-bg-black py-16 sm:py-24 custom-dots">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-accent-pink/5 blur-3xl" />
      <div className="absolute top-1/4 right-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-success-green/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual copy & CTA */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center">
            {/* DESIGN.md spec badge */}
            <div className="inline-flex self-start items-center overflow-hidden rounded-md border border-accent-pink/25 bg-surf-1/85 text-xs text-text-1 mb-4 sm:mb-6 backdrop-blur-sm">
              <span className="flex h-9 w-10 items-center justify-center border-r border-accent-pink/20 bg-surf-2">
                <svg
                  aria-hidden="true"
                  className="h-[18px] w-[18px] shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                    fill="#EA4335"
                  />
                </svg>
              </span>
              <span className="px-4 font-geist text-sm text-text-1">
                Built on Google's DESIGN.md spec
              </span>
            </div>

            {/* H1 Display Title */}
            <h1 className="font-pixel-line text-5xl sm:text-6xl text-text-white tracking-wide leading-none mb-6 uppercase">
              Turn any design <br className="hidden sm:inline" />
              into <span className="text-accent-pink underline decoration-wavy decoration-accent-pink/65">production-ready</span> <br />
              documentation.
            </h1>

            {/* Description Subtext */}
            <p className="font-geist text-base sm:text-lg text-muted-text max-w-lg leading-relaxed mb-8">
              Upload screenshots, Figma files, or live URLs and instantly generate structured, engine-grade design system documentation for engineers and designers.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={onCtaclick}
                className="flex h-12 items-center justify-center rounded-md bg-accent-pink text-black px-6 text-sm font-semibold tracking-wide hover:bg-accent-pink/90 border border-transparent hover:border-border-active transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>Generate DESIGN.md</span>
                <Sparkles size={16} className="ml-2" />
              </button>

              <button
                onClick={onWatchDemoClick}
                className="flex h-12 items-center justify-center rounded-md bg-surf-2 text-text-1 px-5 text-sm font-medium hover:bg-surf-3 hover:text-text-white border border-border-match hover:border-border-active transition-all cursor-pointer"
              >
                <Play size={14} className="mr-2 fill-current" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust and Performance Benchmarks */}
            <div className="border-t border-border-match/60 pt-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <span className="block text-2xl font-bold font-mono text-text-white">4.8k★</span>
                  <span className="text-xs font-geist text-text-3 uppercase tracking-wider block mt-1">Repo Stars</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold font-mono text-[#3DD68C]">~1.2m</span>
                  <span className="text-xs font-geist text-text-3 uppercase tracking-wider block mt-1">Extraction Speed</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold font-mono text-accent-pink">99.4%</span>
                  <span className="text-xs font-geist text-text-3 uppercase tracking-wider block mt-1">Doc Accuracy</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Dynamic interactive workspace mockup */}
          <div className="lg:col-span-7 w-full">
            <div className="rounded-lg border border-border-match bg-surf-1 shadow-2xl overflow-hidden relative">
              
              {/* Mockup Header tab bars */}
              <div className="bg-surf-2 border-b border-border-match px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center justify-between w-full sm:w-auto gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-error-red opacity-80" />
                    <span className="h-3 w-3 rounded-full bg-warning-orange opacity-80" />
                    <span className="h-3 w-3 rounded-full bg-success-green opacity-80" />
                  </div>
                  <span className="text-xs font-mono text-muted-text ml-2 bg-bg-black/80 px-2.5 py-0.5 rounded border border-border-match/40">
                    ai-analyst.local
                  </span>
                </div>

                {/* Switcher tabs */}
                <div className="flex gap-1 w-full sm:w-auto justify-center sm:justify-end">
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${activeTab === 'preview' ? 'bg-accent-pink text-black font-semibold' : 'text-text-3 hover:text-text-1'}`}
                  >
                    Workspace
                  </button>
                  <button 
                    onClick={() => setActiveTab('schema')}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${activeTab === 'schema' ? 'bg-accent-pink text-black font-semibold' : 'text-text-3 hover:text-text-1'}`}
                  >
                    System Tokens
                  </button>
                  <button 
                    onClick={() => setActiveTab('terminal')}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${activeTab === 'terminal' ? 'bg-accent-pink text-black font-semibold' : 'text-text-3 hover:text-text-1'}`}
                  >
                    AI Engine Log
                  </button>
                </div>
              </div>

              {/* Mockup Interface Body */}
              <div className="min-h-[460px] sm:h-[380px] p-5 relative overflow-hidden bg-bg-black custom-scanlines flex flex-col">
                
                {/* Visualizer Frame: Scanning active theme */}
                {activeTab === 'preview' && (
                  <div className="h-full flex flex-col justify-between flex-1">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Sub-Panel 1: Upload preview and Bounding Boxes */}
                      <div className="border border-border-match bg-surf-6 rounded-md p-3 relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-x-0 z-30 h-0.5 bg-accent-pink shadow-[0_0_8px_rgba(167,215,210,0.8)] sweep-active" />
                        
                        <div className="flex justify-between items-center border-b border-border-match/50 pb-2 mb-2">
                          <span className="text-xs font-mono text-muted-text uppercase tracking-wider block">source_canvas.jpg</span>
                          <span className="text-[10px] bg-accent-pink/10 border border-accent-pink/30 text-accent-pink px-1.5 py-0.5 rounded font-mono">
                            SCANNED
                          </span>
                        </div>

                        {/* Source dashboard image being analyzed */}
                        <div className="flex-1 bg-bg-black/55 rounded border border-dashed border-border-match/40 relative min-h-[140px] overflow-hidden">
                          <img
                            src="/cronos-dashboard.png"
                            alt="Cronos dashboard source canvas"
                            className="absolute inset-0 h-full w-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-black/25" />
                          <div className="absolute left-1/2 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-match bg-black/55 text-text-3 backdrop-blur-sm">
                            <Layers size={18} className="text-accent-pink" />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent px-3 pb-3 pt-10 text-center">
                            <p className="text-xs font-semibold text-text-white font-mono">cronos-dashboard.png</p>
                            <p className="text-[11px] text-[#A0A0A0] font-mono mt-0.5">1920 × 1080 • Web App</p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                          <span className="text-text-3">AI confidence level:</span>
                          <span className="text-[#3DD68C] font-semibold">99.4% Verified</span>
                        </div>
                      </div>

                      {/* Sub-Panel 2: Generating output preview.md */}
                      <div className="border border-border-match bg-surf-2 rounded-md p-3 flex flex-col justify-between overflow-hidden">
                        <div className="flex justify-between items-center border-b border-border-match/50 pb-2 mb-2">
                          <span className="text-xs font-mono text-text-white uppercase tracking-wider block">DOCUMENT: DESIGN.md</span>
                          <span className="text-[11px] text-[#3DD68C] flex items-center gap-1 font-mono font-medium">
                            <span className="h-1.5 w-1.5 bg-[#3DD68C] rounded-full animate-ping" />
                            LIVE
                          </span>
                        </div>

                        {/* Text feed showing markdown */}
                        <div className="flex-1 font-mono text-xs text-text-2 space-y-2 overflow-hidden leading-relaxed block text-left p-1 bg-black/30 rounded">
                          <p className="text-accent-pink"># Design System: Cronos Dashboard</p>
                          <p className="text-text-3">## Color Tokens</p>
                          <p className="pl-2 text-text-white">- <span className="text-accent-pink">background:</span> #000000</p>
                          <p className="pl-2 text-text-white">- <span className="text-accent-pink">surface:</span> #0A0A0A</p>
                          <p className="pl-2 text-text-white">- <span className="text-accent-pink">primary:</span> #A7D7D2 (Cyan)</p>
                          <p className="text-text-3">## Typography Hierarchy</p>
                          <p className="pl-2 text-text-2">- H1: VT323 Display (48px)</p>
                          <p className="pl-2 text-text-2">- Body Text: Geist (14px)</p>
                          <p className="text-text-3">## Component Details</p>
                          <p className="pl-2 text-[#3DD68C]">&lt;button className="px-3 bg-[#A7D7D2]"&gt;</p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border-match/40 flex items-center justify-between text-xs font-mono text-text-3">
                          <span>Rendering doc block...</span>
                          <span className="text-accent-pink font-semibold">12 KB generated</span>
                        </div>
                      </div>

                    </div>

                    {/* Progress slider bar */}
                    <div className="mt-4 bg-surf-2 border border-border-match p-2.5 rounded flex flex-col sm:flex-row items-center gap-3 justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-text-3">Pipeline Status:</span>
                        <span className="text-xs font-bold text-[#A7D7D2] font-mono uppercase tracking-wide">Analyzing Geometry</span>
                      </div>
                      <div className="w-full sm:w-1/3 bg-bg-black rounded-full h-2 overflow-hidden border border-border-match">
                        <div 
                          className="bg-accent-pink h-full rounded-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <div className="text-xs font-mono text-accent-pink font-semibold">
                        {scanProgress}% completed
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Dynamic Design Tokens */}
                {activeTab === 'schema' && (
                  <div className="h-full flex flex-col justify-between text-left font-mono text-xs flex-1">
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      <div className="bg-surf-2 border border-border-match p-3 rounded">
                        <p className="text-accent-pink text-xs mb-1.5 font-semibold">// COLOR PALETTE DETECTED</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 bg-black border border-border-match rounded" />
                            <span>bg-black: #000000</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 bg-[#0A0A0A] border border-border-match rounded" />
                            <span>surface: #0A0A0A</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 bg-[#A7D7D2] border border-border-match rounded" />
                            <span>accent_cyan: #A7D7D2</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 bg-[#3DD68C] border border-border-match rounded" />
                            <span>success_green: #3DD68C</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surf-2 border border-border-match p-3 rounded">
                        <p className="text-[#3DD68C] text-xs mb-1.5 font-semibold">// TYPOGRAPHY HIERARCHY VARIABLES</p>
                        <div className="space-y-1 text-xs text-text-2">
                          <p>H1 {"->"} font-family: 'VT323', line-height: 1.0, size: 48px</p>
                          <p>H2 {"->"} font-family: 'VT323', line-height: 1.1, size: 40px</p>
                          <p>Body {"->"} font-family: 'Geist', line-height: 1.5, size: 14px</p>
                        </div>
                      </div>

                      <div className="bg-surf-2 border border-border-match p-3 rounded">
                        <p className="text-warning-orange text-xs mb-1 font-semibold">// COMPONENT MATRIX SPEC (BUTTON)</p>
                        <p className="text-xs text-[#A0A0A0]">Base Radius: 8px. Height Constraint: 38px. Alignment: Horizontal Flex layout.</p>
                      </div>
                    </div>

                    <div className="text-xs text-text-3 pt-2 text-right">
                      Active Schema: <span className="text-text-white font-semibold">v1.4 Spec</span>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: AI engine console logger logs output */}
                {activeTab === 'terminal' && (
                  <div className="h-full flex flex-col justify-between font-mono text-left bg-black p-4 border border-border-match rounded-md flex-1">
                    <div className="space-y-3.5 text-xs text-text-2 flex-1">
                      <div className="flex items-center gap-2 text-accent-pink">
                        <Terminal size={14} />
                        <span className="font-bold">DESIGN-AI ENGINE LOCALHOST</span>
                      </div>
                      
                      <div className="space-y-2 text-xs text-text-3">
                        {mockLogs.map((log, idx) => (
                           <p key={idx} className="leading-relaxed">
                            <span className="text-muted-text">[{idx}]</span> {log}
                          </p>
                        ))}
                        <p className="text-accent-pink animate-pulse">
                          <span>$ </span>
                          <span className="text-text-1">await rendering()</span>
                          <span className="inline-block w-1.5 h-3.5 bg-accent-pink ml-1 cursor-blink-pink" />
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[#A0A0A0] text-right mt-2">
                      System pipeline secure: 256-bit SSL encrypted.
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
