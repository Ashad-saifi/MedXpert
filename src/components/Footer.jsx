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
            
            {/* Social SVGs */}
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-200" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-400 text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-200" aria-label="Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors duration-200" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
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
