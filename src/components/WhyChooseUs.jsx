import React from 'react';

/**
 * WhyChooseUs Component
 * Renders reasons for selecting the hospital, detailing emergency helplines,
 * report uploading speed, telemedicine consults, and accurate statistics.
 */
export default function WhyChooseUs() {
  const reasons = [
    {
      title: '24/7 Emergency Support',
      desc: 'Our critical care team and emergency trauma room operate continuously, providing life-saving response whenever you need it.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-red-500 shadow-red-500/20',
    },
    {
      title: 'Experienced Doctors',
      desc: 'We house medical specialists with decades of hands-on experience, international training, and proven histories of clinical success.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      iconBg: 'bg-blue-600 shadow-blue-500/20',
    },
    {
      title: 'Fast & Secure Reports',
      desc: 'All lab results, pathology findings, and radiology diagnostics are securely uploaded to your EHR account within hours.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      iconBg: 'bg-emerald-500 shadow-emerald-500/20',
    },
    {
      title: 'Online Consultations',
      desc: 'Connect with a physician face-to-face from your home through high-definition video calls integrated directly into your web dashboard.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: 'bg-indigo-500 shadow-indigo-500/20',
    },
    {
      title: 'Modern Equipment',
      desc: 'Our surgical theaters and screening laboratories are equipped with the latest technology, helping minimize operation risks.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      iconBg: 'bg-amber-500 shadow-amber-500/20',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Block: Narrative text */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">
              Why Choose Us
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              We Set the Benchmarks for Clinical Integrity
            </h3>
            <div className="h-1 w-16 bg-blue-600 mx-auto lg:mx-0 rounded" />
            <p className="text-slate-600 leading-relaxed">
              At MedXpert, our core priority is patient safety and high-fidelity diagnosis. We continue to upgrade our systems, bring in expert clinicians, and streamline medical reporting so you receive care without delay.
            </p>
            
            {/* Quick stats boxes */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-left">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50">
                <p className="text-2xl font-black text-blue-600">99.9%</p>
                <p className="text-xs font-semibold text-slate-500">Diagnosis Accuracy</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50">
                <p className="text-2xl font-black text-blue-600">30 Min</p>
                <p className="text-xs font-semibold text-slate-500">Avg. Consultation Wait</p>
              </div>
            </div>
          </div>

          {/* Right Block: Reason Cards Grid */}
          <div className="lg:col-span-7 space-y-6">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-card duration-300 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 hover:-translate-y-0.5"
              >
                {/* Icon Circle */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${reason.iconBg}`}
                >
                  {reason.icon}
                </div>
                
                {/* Reason description */}
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-800">
                    {reason.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {reason.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
