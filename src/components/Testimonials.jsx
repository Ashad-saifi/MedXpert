import React from 'react';

/**
 * Testimonials Component
 * Renders quotes from past patients detailing their treatments and ratings.
 * Styled with custom avatars and profile footer items.
 */
export default function Testimonials() {
  const reviews = [
    {
      name: 'Aarav Mehta',
      role: 'Chronic Patient (Diabetes)',
      text: "The integration of online consultations and instant health records has changed how I manage my diabetes. Dr. Neha Kapoor answers my follow-ups via video in minutes, and I don't have to wait in queues for prescriptions.",
      rating: 5,
      avatar: 'AM',
      avatarBg: 'bg-teal-100 text-teal-700',
    },
    {
      name: 'Priya Verma',
      role: 'Telemedicine Patient',
      text: "During an emergency late at night, I was able to consult a general physician immediately through the MedXpert platform. The doctor was patient, diagnosed my symptoms clearly, and emailed my prescription instantly. Outstanding service!",
      rating: 5,
      avatar: 'PV',
      avatarBg: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'Rohan Malhotra',
      role: 'In-Patient (Cardiology Surgery)',
      text: 'The cardiology department at MedXpert is top-tier. Dr. Raj Patel and his surgical team saved my father after a severe blockade. The ICU facilities are modern, and the nursing staff was extremely supportive throughout.',
      rating: 5,
      avatar: 'RM',
      avatarBg: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Testimonials
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            What Our Patients Say About Us
          </h3>
          <div className="h-1 w-16 bg-blue-600 mx-auto rounded" />
          <p className="text-lg text-slate-600">
            Read positive experiences from patients who received specialized treatment and digital healthcare support from our medical crew.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div
              key={rev.name}
              className="bg-slate-50 border border-slate-200/50 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-lg transition-card duration-300 relative group"
            >
              
              {/* Watermark Quote */}
              <span className="absolute top-6 right-8 text-6xl text-blue-500/10 font-serif select-none">
                “
              </span>

              {/* Review content */}
              <div className="space-y-4">
                
                {/* Rating stars */}
                <div className="flex space-x-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>

                {/* Body Quote */}
                <p className="text-slate-600 text-sm leading-relaxed italic relative z-10">
                  "{rev.text}"
                </p>
              </div>

              {/* Patient Profile Footer info */}
              <div className="flex items-center space-x-4 mt-8 pt-4 border-t border-slate-200/50">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rev.avatarBg}`}
                >
                  {rev.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-900 transition-colors duration-150">
                    {rev.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {rev.role}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
