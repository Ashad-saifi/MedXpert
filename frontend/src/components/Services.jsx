import React from 'react';

/**
 * Services Component
 * Displays grid cards of the hospital's primary specialties.
 * Outfitted with custom SVG graphics, hover scaling, and translations.
 */
export default function Services() {
  const servicesList = [
    {
      title: 'Cardiology',
      desc: 'Expert treatment for complex heart conditions, coronary blockages, arrhythmias, and comprehensive cardiac screening.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      color: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      title: 'Radiology',
      desc: 'High-resolution imaging including digital X-Rays, high-slice CT scans, state-of-the-art MRI, and detailed ultrasound diagnoses.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m0 11v3m8.5-6h-3M4.5 12h-3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 7.464M12 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      ),
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      title: 'Neurology',
      desc: 'Advanced therapeutics for neurological disorders, spine injuries, epilepsy management, stroke response, and nerve therapies.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h2v-5.457" />
        </svg>
      ),
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Dental Care',
      desc: 'Comprehensive dental surgery, structural root canals, pediatric dentistry, orthodontics, and routine hygiene care.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'ICU (Intensive Care)',
      desc: 'Continuous multi-parameter critical monitoring, ventilator support, and dedicated bedside nursing 24/7.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Emergency',
      desc: 'Fast-response trauma medicine, instant triage assessments, and immediate resuscitation for severe clinical cases.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'Orthopedic',
      desc: 'Expert care for bone fractures, spine alignment, joint replacements, physical sports medicine, and reconstructive surgeries.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      color: 'bg-violet-50 text-violet-600 border-violet-100',
    },
  ];

  return (
    <section id="services" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Our Specialties
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Healthcare Under One Roof
          </h3>
          <div className="h-1 w-16 bg-blue-600 mx-auto rounded" />
          <p className="text-lg text-slate-600">
            MedXpert provides an extensive spectrum of clinical departments. Our medical professionals utilize advanced methodologies to deliver optimal patient outcomes.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, index) => (
            <div
              key={service.title}
              className={`bg-white border rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-card duration-300 group hover:-translate-y-1 ${
                index === servicesList.length - 1 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Icon container */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${service.color}`}
              >
                {service.icon}
              </div>

              {/* Specialty name */}
              <h4 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-900 transition-colors duration-200">
                {service.title}
              </h4>

              {/* Description */}
              <p className="text-slate-600 text-sm leading-relaxed">
                {service.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
