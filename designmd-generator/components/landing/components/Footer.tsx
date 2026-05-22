import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  const links = [
    { label: 'Documentation', href: '#' },
    { label: 'GitHub Repository', href: 'https://github.com/design-md/design-md' },
    { label: 'Cloud API', href: '#' },
    { label: 'Twitter / X', href: 'https://twitter.com' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Use', href: '#' }
  ];

  return (
    <footer className="bg-bg-black border-t border-border-match py-12 relative z-10 text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Left brand logo indicators */}
          <div className="flex items-center gap-2.5">
            <span className="font-geist text-xl sm:text-2xl font-bold tracking-tight text-white">
              mydesign<span className="text-accent-pink">.md</span>
            </span>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {links.map((link) => (
              <a 
                key={link.label}
                href={link.href}
                className="text-xs font-mono text-text-3 hover:text-accent-pink transition-colors"
                onClick={(e) => link.href === '#' && e.preventDefault()}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Copy status notes */}
          <div className="text-[10px] font-mono text-muted-medium flex items-center gap-1">
            <Shield size={11} className="text-success-green" />
            <span>© 2026 mydesign.md. MIT Licensed.</span>
          </div>

        </div>

      </div>
    </footer>
  );
}
