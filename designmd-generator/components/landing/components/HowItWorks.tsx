import React from 'react';
import { UploadCloud, Binary, FileCheck, ArrowRight } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../data';

export default function HowItWorks() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UploadCloud': return <UploadCloud size={24} className="text-accent-pink" />;
      case 'Binary': return <Binary size={24} className="text-accent-pink" />;
      case 'FileCode': return <FileCheck size={24} className="text-accent-pink" />;
      default: return <UploadCloud size={24} className="text-accent-pink" />;
    }
  };

  return (
    <section id="how-it-works" className="border-b border-border-match bg-bg-black py-16 sm:py-20 relative custom-dots">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-mono text-xs text-accent-pink uppercase tracking-widest block mb-2">Automated Pipeline</span>
          <h2 className="font-pixel-square text-3xl sm:text-4xl text-text-white mb-4 uppercase tracking-tight">
            How It Works
          </h2>
          <p className="font-geist text-sm text-muted-text">
            Three simple procedural phases to bridge visual creative mockups and machine-readable codebase assets.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            return (
              <div 
                key={step.step} 
                className="bg-surf-1 border border-border-match rounded-lg p-6 relative hover:border-border-active transition-all group flex flex-col justify-between"
              >
                {/* Horizontal flow line connector */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 translate-x-1/2 z-20 text-border-active">
                    <ArrowRight size={20} className="text-accent-pink" />
                  </div>
                )}
                
                <div className="space-y-4 text-left">
                  {/* Step ID badge logo */}
                  <div className="flex justify-between items-center">
                    <div className="h-10 w-10 bg-surf-3 border border-border-match rounded-md flex items-center justify-center">
                      {getIcon(step.icon)}
                    </div>
                    <span className="font-mono text-3xl font-bold text-border-active/60 tracking-tight group-hover:text-accent-pink transition-colors">
                      {step.step}
                    </span>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-lg font-bold text-text-white tracking-wide font-geist uppercase">
                    {step.title}
                  </h3>

                  {/* Step description detail */}
                  <p className="font-geist text-xs sm:text-sm text-text-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Micro step tracker foot label */}
                <div className="border-t border-border-match/45 pt-4 mt-6 text-[10px] font-mono text-text-3 text-left">
                  System Phase status: <span className="text-text-white font-semibold">STANDBY_NEXT</span>
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
