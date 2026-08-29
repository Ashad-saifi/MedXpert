import React, { useState, useEffect } from 'react';

/**
 * Navbar Component
 * Renders the responsive header menu, logo branding, anchors links,
 * and handles scrolling offsets for smooth section transitions.
 */
export default function Navbar({ onOpenLogin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add shadow and border on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', target: 'home' },
    { name: 'About', target: 'about' },
    { name: 'Services', target: 'services' },
    { name: 'Doctors', target: 'doctors' },
    { name: 'Contact', target: 'contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Name */}
          <a
            href="#home"
            onClick={(e) => handleScrollTo(e, 'home')}
            className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-blue-900 group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <span className="text-xl">X</span>
            </div>
            <span className="font-extrabold text-blue-900">
              Med<span className="text-orange-500">X</span>pert
            </span>
          </a>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.target}`}
                onClick={(e) => handleScrollTo(e, link.target)}
                className="text-base font-semibold text-slate-600 hover:text-orange-500 transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Action Trigger Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => { window.location.hash = '#/admin/login'; }}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-full transition-all duration-200 flex items-center gap-1.5"
            >
              <span>🛡️</span> Admin Portal
            </button>
            <button
              onClick={onOpenLogin}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Login / Signup
            </button>
          </div>

          {/* Mobile Hambuger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-blue-600 p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6 fill-none stroke-current" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 px-6 absolute top-full left-0 right-0 shadow-lg animate-fadeIn">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.target}`}
                onClick={(e) => handleScrollTo(e, link.target)}
                className="text-base font-semibold text-slate-700 hover:text-orange-500 transition-colors duration-150 py-2 border-b border-slate-50"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenLogin();
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full text-center shadow-md shadow-orange-500/10 transition-colors duration-150"
            >
              Login / Signup
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
