import React from 'react';
import { 
  Palette, 
  Type, 
  Ruler, 
  Box, 
  Eye, 
  FileText, 
  Sparkles, 
  Coins 
} from 'lucide-react';
import { SYSTEM_FEATURES } from '../data';

export default function Features() {
  
  // Custom interactive visual layout builders for each card
  const getFeatureMicroWidget = (id: string) => {
    switch (id) {
      case 'extract-colors':
        return (
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-border-match/45">
            <div className="h-5 w-5 rounded bg-black border border-border-match flex items-center justify-center text-[7px] text-text-3">#00</div>
            <div className="h-5 w-5 rounded bg-[#0A0A0A] border border-border-match flex items-center justify-center text-[7px] text-text-3">#0A</div>
            <div className="h-5 w-5 rounded bg-[#A7D7D2] border border-border-match flex items-center justify-center text-[7px] text-black font-semibold">#A7</div>
            <div className="h-5 w-5 rounded bg-[#3DD68C] border border-border-match flex items-center justify-center text-[7px] text-black font-semibold">#3D</div>
            <span className="text-[10px] font-mono text-[#3DD68C] self-center ml-auto">✓ 99% accuracy</span>
          </div>
        );
      case 'typography-detection':
        return (
          <div className="space-y-1.5 mt-3 pt-3 border-t border-border-match/45 text-left font-mono text-[9px]">
            <div className="flex justify-between items-center text-accent-pink">
              <span>H1_DISPLAY:</span>
              <span>VT323 (48px)</span>
            </div>
            <div className="flex justify-between items-center text-text-2">
              <span>BODY_PARAGRAPH:</span>
              <span>Geist (14px)</span>
            </div>
            <div className="flex justify-between items-center text-text-3">
              <span>METRICS_VAL:</span>
              <span>Geist Mono (12px)</span>
            </div>
          </div>
        );
      case 'spacing-analysis':
        return (
          <div className="mt-3 pt-3 border-t border-border-match/45 flex items-center gap-1.5 font-mono text-[9px] text-text-3">
            <span className="px-1.5 py-0.5 bg-surf-3 rounded border border-border-match text-text-2">xs: 4px</span>
            <span>{"->"}</span>
            <span className="px-1.5 py-0.5 bg-surf-3 rounded border border-border-match text-text-2">md: 12px</span>
            <span>{"->"}</span>
            <span className="px-1.5 py-0.5 bg-surf-3 rounded border border-border-match text-text-2">xl: 24px</span>
          </div>
        );
      case 'component-inventory':
        return (
          <div className="mt-3 pt-3 border-t border-border-match/45 flex items-center justify-between">
            <button className="h-6 px-2 bg-accent-pink text-black text-[9px] font-mono rounded font-medium">Button Primary</button>
            <div className="h-6 w-6 rounded-full border border-dashed border-border-match flex items-center justify-center text-[8px] text-text-3">✕</div>
            <span className="text-[9px] font-mono text-muted-text">2 component blueprints</span>
          </div>
        );
      case 'accessibility-insights':
        return (
          <div className="mt-3 pt-3 border-t border-border-match/45 flex justify-between items-center font-mono text-[9px]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success-green" />
              <span className="text-text-2 font-bold">Contrast AAA</span>
            </div>
            <span className="text-success-green">Score 10/10</span>
          </div>
        );
      case 'extract-markdown':
        return (
          <div className="mt-3 pt-3 border-t border-border-match/45 flex items-center justify-between text-[10px] font-mono text-text-3">
            <span className="text-accent-pink text-[9px] bg-accent-pink/5 border border-accent-pink/20 px-1 py-0.5 rounded">DESIGN.md</span>
            <span>12 KB output size</span>
          </div>
        );
      case 'ai-recommendations':
        return (
          <div className="mt-3 pt-3 border-t border-border-match/45 flex items-center justify-between font-mono text-[9px] text-[#3DD68C]">
            <span>💡 Consolidation Advice</span>
            <span>Remove #0D0D0D</span>
          </div>
        );
      case 'token-generation':
        return (
          <div className="mt-3 pt-3 border-t border-border-match/45 flex justify-between gap-1 text-[9px] font-mono">
            <span className="text-text-3">exports:</span>
            <span className="text-[#3DD68C]">[JSON]</span>
            <span className="text-accent-pink">[CSS]</span>
            <span className="text-text-2">[Tailwind]</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Palette': return <Palette size={18} className="text-accent-pink" />;
      case 'Type': return <Type size={18} className="text-accent-pink" />;
      case 'Ruler': return <Ruler size={18} className="text-accent-pink" />;
      case 'Box': return <Box size={18} className="text-accent-pink" />;
      case 'Eye': return <Eye size={18} className="text-accent-pink" />;
      case 'FileText': return <FileText size={18} className="text-accent-pink" />;
      case 'Sparkles': return <Sparkles size={18} className="text-accent-pink" />;
      case 'Coins': return <Coins size={18} className="text-accent-pink" />;
      default: return <Palette size={18} className="text-accent-pink" />;
    }
  };

  return (
    <section id="features" className="border-b border-border-match bg-surf-1 py-16 sm:py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Features Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-mono text-xs text-accent-pink uppercase tracking-widest block mb-2">Engine Scope</span>
          <h2 className="font-pixel-square text-3xl sm:text-4xl text-text-white mb-4 uppercase tracking-tight">
            Features & Capabilities
          </h2>
          <p className="font-geist text-sm text-muted-text">
            Comprehensive code analysis designed to standardize design guidelines directly to engineer repositories.
          </p>
        </div>

        {/* Features Bento/Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SYSTEM_FEATURES.map((feat) => {
            return (
              <div 
                key={feat.id}
                className="bg-bg-black border border-border-match p-5 rounded-lg flex flex-col justify-between hover:border-border-active transition-all"
              >
                <div className="space-y-3 text-left">
                  {/* Title & Icon Header */}
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-8 bg-surf-3 border border-border-match rounded flex items-center justify-center">
                      {getIcon(feat.icon)}
                    </div>
                    
                    {/* Visual micro feature badges */}
                    <span className="text-[9px] font-mono text-accent-pink bg-accent-pink/5 border border-accent-pink/20 px-2 py-0.5 rounded">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="font-geist text-base font-semibold leading-snug text-text-white uppercase tracking-wide">
                    {feat.title}
                  </h3>

                  <p className="font-geist text-xs text-[#A0A0A0] leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Micro illustration widget inside feature card */}
                {getFeatureMicroWidget(feat.id)}

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
