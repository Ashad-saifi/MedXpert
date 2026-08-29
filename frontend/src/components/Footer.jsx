import React from 'react';

/**
 * Footer Component
 * Renders quick links, emergency status boxes, mock social media icons,
 * and copyright guidelines.
 */
export default function Footer() {
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Top Foot structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-slate-800">
          
          {/* Column 1: Hospital details */}
          <div className="md:col-span-5 space-y-4">
            <a
              href="#home"
              onClick={(e) => handleScrollTo(e, 'home')}
              className="flex items-center space-x-2 text-2xl font-bold tracking-tight text-white group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="text-xl">X</span>
              </div>
              <span className="font-extrabold">
                Med<span className="text-orange-500">X</span>pert
              </span>
            </a>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              MedXpert is a unified smart digital healthcare system, merging leading medical practices with real-time video consultations, online scheduling, and secure EHR folders.
            </p>
            
            {/* 3D Layered Social Media with Tooltips */}
            <div className="flex items-center gap-6 pt-6 pb-2">
              {/* Facebook */}
              <div className="tooltip-container facebook">
                <div className="tooltip">
                  <div className="profile">
                    <div className="user">
                      <div className="img">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div className="details">
                        <div className="name">Facebook</div>
                        <div className="handle">@MedXpertHealth</div>
                      </div>
                    </div>
                    <div className="about">Official Page & Updates</div>
                  </div>
                </div>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="icon" aria-label="Facebook">
                  <div className="layer">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span className="facebookSVG">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </span>
                  </div>
                  <div className="text">Facebook</div>
                </a>
              </div>

              {/* Instagram */}
              <div className="tooltip-container instagram">
                <div className="tooltip">
                  <div className="profile">
                    <div className="user">
                      <div className="img">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="details">
                        <div className="name">Instagram</div>
                        <div className="handle">@medxpert_health</div>
                      </div>
                    </div>
                    <div className="about">Daily Health & Wellness</div>
                  </div>
                </div>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="icon" aria-label="Instagram">
                  <div className="layer">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span className="instagramSVG">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </span>
                  </div>
                  <div className="text">Instagram</div>
                </a>
              </div>

              {/* Twitter / X */}
              <div className="tooltip-container twitter">
                <div className="tooltip">
                  <div className="profile">
                    <div className="user">
                      <div className="img">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div className="details">
                        <div className="name">Twitter / X</div>
                        <div className="handle">@MedXpert_HQ</div>
                      </div>
                    </div>
                    <div className="about">News & Real-time Alerts</div>
                  </div>
                </div>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="icon" aria-label="Twitter">
                  <div className="layer">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span className="twitterSVG">
                      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </span>
                  </div>
                  <div className="text">Twitter</div>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-white text-base font-bold tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" onClick={(e) => handleScrollTo(e, 'home')} className="hover:text-white transition-colors duration-150">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleScrollTo(e, 'about')} className="hover:text-white transition-colors duration-150">
                  About Us
                </a>
              </li>
              <li>
                <a href="#services" onClick={(e) => handleScrollTo(e, 'services')} className="hover:text-white transition-colors duration-150">
                  Specialties
                </a>
              </li>
              <li>
                <a href="#doctors" onClick={(e) => handleScrollTo(e, 'doctors')} className="hover:text-white transition-colors duration-150">
                  Our Doctors
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="hover:text-white transition-colors duration-150">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Emergency details */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-white text-base font-bold tracking-wider uppercase">
              Emergency Contact
            </h4>
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Ambulance & Emergency
              </p>
              <p className="text-xl font-extrabold text-red-500">
                +91 1800 234 5678
              </p>
              <p className="text-xs text-slate-400">
                Available 24 hours a day, 7 days a week. Dual-response trauma teams.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 text-xs text-slate-500 space-y-4 sm:space-y-0">
          <p>© 2026 MedXpert Hospital Group. All rights reserved. MIT License.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Use</a>
            <a href="#" className="hover:text-slate-300">Security</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
