import React from 'react';
import Link from 'next/link';
import { Fingerprint, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground py-16 px-4 sm:px-6 lg:px-8 border-t border-foreground/10 text-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 group mb-6">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">SyncRoll</span>
            </Link>
            <p className="text-background/60 text-sm mb-6 max-w-xs">
              Next-generation attendance management system for modern teams and educational institutions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-background/50 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/50 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/50 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-6">Product</h3>
            <ul className="space-y-4">
              {['Features', 'Integrations', 'Pricing', 'Changelog'].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase()}`} className="text-sm text-background/60 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-6">Company</h3>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Blog', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-background/60 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-6">Legal</h3>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <Link href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-background/60 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-12 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/40">
          <p>© {new Date().getFullYear()} SyncRoll Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-background/80 transition-colors">Status</a>
            <a href="#" className="hover:text-background/80 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
