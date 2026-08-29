import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import About from '../components/About.jsx';
import Services from '../components/Services.jsx';
import Doctors from '../components/Doctors.jsx';
import WhyChooseUs from '../components/WhyChooseUs.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Contact from '../components/Contact.jsx';
import Footer from '../components/Footer.jsx';
import LoginModal from '../components/LoginModal.jsx';

/**
 * LandingPage component
 * Assembles all individual sections (Navbar, Hero, About, Services, Doctors, WhyChooseUs,
 * Testimonials, Contact, Footer) into the main single-page layout.
 * Manages modal visibility for the Login / Sign Up portal gateways.
 */
export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white dark-mode-landing">
      
      {/* 1. Navbar Navigation Bar */}
      <Navbar onOpenLogin={() => window.location.href = '/medxpert.html'} />

      {/* Main Sections Wrapper */}
      <main className="flex-grow animate-fadeIn">
        {/* 2. Hero Banner */}
        <Hero />

        {/* 3. About Section */}
        <About />

        {/* 4. Services Specialties Card Grid */}
        <Services />

        {/* 5. Doctors Directory Profiles */}
        <Doctors />

        {/* 6. Why Choose Us Advantages */}
        <WhyChooseUs />

        {/* 7. Patient Testimonials Reviews */}
        <Testimonials />

        {/* 8. Contact Form & Maps Location */}
        <Contact />
      </main>

      {/* 9. Site Footer Information */}
      <Footer />

      {/* 10. Login / Signup Portal Gateway Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

    </div>
  );
}
