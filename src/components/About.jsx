import React from 'react';

/**
 * About Component
 * Renders critical hospital descriptions, experience stats, facilities highlight boxes,
 * and emergency hotline numbers.
 */
export default function About() {
  const highlights = [
    {
      title: 'Trusted Specialists',
      desc: 'Access a team of over 150+ board-certified doctors, surgeons, and therapists across multiple specialties.',
      icon: '👨‍⚕️',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Advanced Facilities',
      desc: 'Outfitted with top-tier modular ICUs, high-resolution radiology suites, and digital monitoring systems.',
      icon: '🏥',
      color: 'bg-cyan-500/10 text-cyan-600',
    },
    {
      title: '24/7 Emergency Care',
      desc: 'Our dedicated critical trauma unit and on-call ambulance teams are prepared to save lives at any hour.',
      icon: '🚨',
      color: 'bg-red-500/10 text-red-600',
    },
    {
      title: 'Integrated Health Records',
      desc: 'Your diagnoses, prescriptions, and lab tests are secured on a single cloud platform for unified clinical access.',
      icon: '📋',
      color: 'bg-indigo-500/10 text-indigo-600',
    },
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            About MedXpert
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pioneering Medical Excellence & Patient Care
          </h3>
          <div className="h-1 w-16 bg-blue-600 mx-auto rounded" />
          <p className="text-lg text-slate-600">
            For over two decades, MedXpert has stood as a beacon of health and wellness, offering a powerful blend of clinical mastery and state-of-the-art diagnostic facilities.
          </p>
        </div>

        {/* Info Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Column 1: Hospital Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <h4 className="text-2xl font-bold text-slate-900">
              Why We Are Trusted by Thousands of Patients
            </h4>
            <p className="text-slate-600 leading-relaxed">
              We believe quality healthcare should be accessible, instantaneous, and stress-free. Our smart hospital structure links physical clinics directly to cloud-based EHR and video consultations, eliminating long queues.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our specialists operate with full medical integrity, supported by a world-class nursing staff and modern equipment to ensure your healing journey is smooth and successful.
            </p>
            
            {/* Helpline panel */}
            <div className="p-6 bg-gradient-to-r from-blue-500 to-sky-600 text-white rounded-2xl shadow-xl shadow-blue-500/15">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">☎️</span>
                <div>
                  <p className="text-sm text-blue-100 font-semibold uppercase tracking-wider">
                    Emergency Helpline
                  </p>
                  <p className="text-2xl font-extrabold">+91 1800 234 5678</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Highlights Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="bg-slate-50 hover:bg-blue-50/40 p-6 rounded-2xl border border-slate-200/50 hover:border-blue-200/60 shadow-sm transition-card duration-300 group hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${item.color}`}
                >
                  {item.icon}
                </div>
                <h5 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-900 transition-colors duration-200">
                  {item.title}
                </h5>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
