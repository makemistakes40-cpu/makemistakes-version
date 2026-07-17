'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="bg-[#010102] border-t border-brand-border py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
        
        {/* Branding & Info */}
        <div className="flex flex-col items-center md:items-start space-y-2">
          <span className="font-display font-bold text-lg text-white">
            Make<span className="text-brand-violet">Mistakes</span>
          </span>
          <span className="text-xs text-brand-slate">
            The AI-guided developer learning platform that turns coding mistakes into opportunities.
          </span>
        </div>

        {/* Links & Techs */}
        <div className="flex flex-col items-center md:items-end space-y-2">
          <div className="flex space-x-6 text-sm text-brand-slate">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
          </div>
          <span className="text-[10px] text-brand-slate/40">
            © {new Date().getFullYear()} MakeMistakes. All rights reserved. Powered by Next.js 15 & Node.js.
          </span>
        </div>

      </div>
    </footer>
  );
}
export default Footer;
