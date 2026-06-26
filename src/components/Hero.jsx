import React from 'react';
import doctorImg from '../assets/hero-doctor.png';

/**
 * Hero Component
 * Displays the healthcare taglines, statistics highlights, Call-to-actions,
 * and renders the expert doctor layout.
 */
export default function Hero() {
  const handleScrollToContact = (e) => {
    e.preventDefault();
    const element = document.getElementById('contact');
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-blue-50 via-white to-sky-50/40 overflow-hidden"
    >
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-sky-400/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Hero Content Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left animate-fadeIn">

            {/* Health indicators pill */}
            <div className="inline-flex items-center space-x-2 bg-orange-50 border border-orange-200/60 rounded-full px-4 py-1.5 shadow-sm">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-xs font-bold text-orange-800 tracking-wide uppercase">
                Smart Digital Telemedicine
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Compassionate Care,<br />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Smart Technology.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Connect with leading healthcare specialists instantly, manage secure EHR records, and book online appointments. Get expert medical consultation from the comfort of your home, 24/7.
            </p>

            {/* Actions CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#contact"
                onClick={handleScrollToContact}
                className="w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                Book Appointment
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto text-center border border-slate-300 hover:border-orange-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-orange-600 font-bold text-lg px-8 py-4 rounded-full transition-all duration-200"
              >
                Learn More
              </a>
            </div>

            {/* Stats Row */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-3xl font-extrabold text-blue-900">12k+</p>
                <p className="text-sm font-semibold text-slate-500">Happy Patients</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-blue-900">150+</p>
                <p className="text-sm font-semibold text-slate-500">Expert Doctors</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-blue-900">99.8%</p>
                <p className="text-sm font-semibold text-slate-500">Uptime Rating</p>
              </div>
            </div>

          </div>

          {/* Hero Doctor Column */}
          <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end animate-fadeIn">
            {/* Backdrop Blur circle */}
            <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full bg-blue-600/5 blur-[40px] pointer-events-none" />

            {/* Image frame */}
            <div className="relative border-4 border-white shadow-2xl rounded-3xl overflow-hidden max-w-sm sm:max-w-md w-full bg-gradient-to-b from-blue-100/50 to-white/90">
              <img
                src={doctorImg}
                alt="Expert Doctor"
                className="w-full h-auto object-cover object-center transform hover:scale-102 transition-transform duration-300"
              />

              {/* Doctor Status overlay card */}
              <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-2xl p-4 shadow-xl border border-white/60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0 animate-pulse">
                    <span>🟢</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Instant Teleconsultation</p>
                    <p className="text-sm font-bold text-slate-800">Doctors Online Right Now</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
