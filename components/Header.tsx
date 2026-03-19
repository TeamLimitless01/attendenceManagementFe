"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Fingerprint } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', role: ['admin', 'student', 'teacher'] },
    //{ name: 'Profile', href: '/profile', role: ['admin', 'student', 'teacher'] },
    { name: 'Dashboard', href: '/admin/dashboard', role: ['admin'] },
    { name: 'Teachers', href: '/admin/users', role: ['admin'] },
    { name: 'Students', href: '/admin/users/students', role: ['admin'] },
    { name: 'My lectures', href: '/teacher/mylectures', role: ['teacher'] },
    { name: 'My lectures', href: '/student/mylectures', role: ['student'] },

    { name: 'Subject & Class Management', href: '/admin/lms', role: ['admin'] },
    {
      name: 'Attendence', href: '/student/attendence', role: ['student']
    },
    {
      name: 'Profile', href: '/student/profile', role: ['student']
    },
    {
      name: 'Attendence', href: '/teacher/attendence', role: ['teacher']
    }, {
      name: 'Dashboard', href: '/teacher/dashboard', role: ['teacher']
    },

  ];

  const filteredNavLinks = navLinks.filter((link) => {
    if (!data) return false;
    if (link.role.includes(data?.user?.role as string)) return true;
    return false;
  });

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-foreground/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-blue-600 rounded-xl group-hover:bg-blue-700 transition-colors">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">SyncRoll</span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            {filteredNavLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm font-medium text-foreground/70 hover:text-blue-600 transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {data ? (
              <button onClick={() => signOut()} className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20">
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                {/* <Link href="/register" className="px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-full hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-foreground/20">
                  Get Started
                </Link> */}
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-foreground hover:bg-foreground/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-foreground/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-foreground/10 my-4" />
              {data ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-center block px-3 py-2 bg-red-600 text-white rounded-md text-base font-medium hover:bg-red-700 transition-colors mt-2"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-blue-600 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 bg-blue-600 text-white rounded-md text-base font-medium hover:bg-blue-700 transition-colors mt-2 text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
export default Header;
