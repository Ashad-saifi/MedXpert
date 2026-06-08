import React from 'react';

/**
 * Doctors Component
 * Displays grid profile cards for doctor portfolios, detailing specialization,
 * experience, locations, reviews, and a "Book Now" scroll action.
 */
export default function Doctors() {
  const doctorsList = [
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'General Medicine',
      experience: '12 Years Experience',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      rating: '4.9',
      reviews: '180',
      location: 'City Medical Center',
    },
    {
      name: 'Dr. Raj Patel',
      specialty: 'Cardiology',
      experience: '18 Years Experience',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      rating: '4.8',
      reviews: '240',
      location: 'Heart & Vascular Clinic',
    },
    {
      name: 'Dr. Neha Kim',
      specialty: 'Endocrinology',
      experience: '9 Years Experience',
      image: 'https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=400',
      rating: '4.7',
      reviews: '115',
      location: 'City Medical Center',
    },
    {
      name: 'Dr. Arun Mehta',
      specialty: 'Neurology',
      experience: '15 Years Experience',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      rating: '4.9',
      reviews: '310',
      location: 'Brain & Spine Institute',
    },
  ];

  const handleBookNow = (e) => {
    e.preventDefault();
    const element = document.getElementById('contact');
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
        </div>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {doctorsList.map((doc) => (
            <div
              key={doc.name}
              className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-card duration-300 group hover:-translate-y-1"
            >
              
              {/* Doctor portrait photo */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{doc.rating}</span>
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
                    <span>{doc.experience}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📍</span>
                    <span>{doc.location}</span>
                  </div>
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
          ))}
        </div>

      </div>
    </section>
  );
}
