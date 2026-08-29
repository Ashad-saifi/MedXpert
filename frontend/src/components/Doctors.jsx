import React, { useState, useEffect } from 'react';

/**
 * Doctors Component
 * Fetches doctor profiles from the backend API and displays them as a
 * responsive card grid. Falls back to static data when the server is offline.
 */

// Static fallback data used when the backend is unreachable
const FALLBACK_DOCTORS = [
  {
    name: 'Dr. Shreya Joshi',
    specialty: 'General Medicine',
    exp: '12 yrs',
    image: '/doctors/dr_shreya_joshi.png',
    rating: 4.9,
    hospital: 'City Medical Center',
  },
  {
    name: 'Dr. Raj Patel',
    specialty: 'Cardiology',
    exp: '18 yrs',
    image: '/doctors/dr_raj_patel.png',
    rating: 4.8,
    hospital: 'Heart & Vascular Clinic',
  },
  {
    name: 'Dr. Neha Kapoor',
    specialty: 'Endocrinology',
    exp: '9 yrs',
    image: '/doctors/dr_neha_kapoor.png',
    rating: 4.7,
    hospital: 'City Medical Center',
  },
  {
    name: 'Dr. Arun Mehta',
    specialty: 'Neurology',
    exp: '15 yrs',
    image: '/doctors/dr_arun_mehta.png',
    rating: 4.9,
    hospital: 'Brain & Spine Institute',
  },
];

// Map doctor name → local image path for seeded doctors
const DOCTOR_IMAGES = {
  'Dr. Shreya Joshi': '/doctors/dr_shreya_joshi.png',
  'Dr. Raj Patel': '/doctors/dr_raj_patel.png',
  'Dr. Neha Kapoor': '/doctors/dr_neha_kapoor.png',
  'Dr. Arun Mehta': '/doctors/dr_arun_mehta.png',
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/doctors');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();

        if (!cancelled) {
          setDoctors(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Backend unreachable, using fallback doctor data:', err.message);
        if (!cancelled) {
          setDoctors(FALLBACK_DOCTORS);
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchDoctors();
    return () => { cancelled = true; };
  }, []);

  const handleBookNow = (e) => {
    e.preventDefault();
    const element = document.getElementById('contact');
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Only show the first 4 doctors on the landing page
  const displayDoctors = doctors.slice(0, 4);

  return (
    <section id="doctors" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Our Specialists
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Meet Our World-Class Medical Professionals
          </h3>
          <div className="h-1 w-16 bg-blue-600 mx-auto rounded" />
          <p className="text-lg text-slate-600">
            Consult with our trusted specialists who are leaders in their respective fields. Our medical staff is dedicated to delivering highly customized, patient-centric treatment.
          </p>
          {error && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
              ⚠️ Showing cached data — backend is offline
            </p>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                  </div>
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                  </div>
                  <div className="h-10 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Doctor Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayDoctors.map((doc) => {
              // Resolve the image: use custom profile image, local image map, or fallback to a gradient avatar
              const imageSrc = doc.profileImage || DOCTOR_IMAGES[doc.name] || doc.image || null;

              return (
                <div
                  key={doc.name || doc._id}
                  className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-card duration-300 group hover:-translate-y-1"
                >
                  
                  {/* Doctor portrait photo */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={doc.name}
                        className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                        <span className="text-5xl text-white/90 font-bold">
                          {doc.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center space-x-1">
                      <span>⭐</span>
                      <span>{doc.rating || '5.0'}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    
                    {/* Specialty */}
                    <div>
                      <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">
                        {doc.specialty}
                      </span>
                      <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-900 transition-colors duration-200 mt-1">
                        {doc.name}
                      </h4>
                    </div>

                    {/* Details list */}
                    <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="flex items-center space-x-2">
                        <span>💼</span>
                        <span>{doc.exp || doc.experience} Experience</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>📍</span>
                        <span>{doc.hospital || doc.location}</span>
                      </div>
                      {doc.fee && (
                        <div className="flex items-center space-x-2">
                          <span>💰</span>
                          <span>Consultation: {doc.fee}</span>
                        </div>
                      )}
                    </div>

                    {/* Book Action Button */}
                    <button
                      onClick={handleBookNow}
                      className="w-full bg-blue-50 hover:bg-blue-600 border border-blue-100 hover:border-blue-600 text-blue-700 hover:text-white font-bold text-sm py-2.5 rounded-xl transition-all duration-200"
                    >
                      Book Now
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
