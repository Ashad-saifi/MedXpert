import React, { useState } from 'react';

/**
 * Contact Component
 * Handles the styled hospital directions columns, map iframe layouts,
 * and maintains the mock booking request states with response notifications.
 */
export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'General Medicine',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in Name, Email, and Phone number.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: 'General Medicine',
        message: '',
      });
    }, 4000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contact" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Contact & Booking
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Get In Touch or Book an Appointment
          </h3>
          <div className="h-1 w-16 bg-blue-600 mx-auto rounded" />
          <p className="text-lg text-slate-600">
            Have questions about our facilities? Ready to schedule a visit? Fill out the form or reach out to our front desk directly.
          </p>
        </div>

        {/* Form and info layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Column 1: Info & Map */}
          <div className="lg:col-span-5 space-y-8">
            <h4 className="text-2xl font-bold text-slate-900">
              City Medical Center
            </h4>
            
            {/* Quick stats items */}
            <div className="space-y-4 text-slate-600">
              <div className="flex items-start space-x-4">
                <span className="text-2xl mt-0.5">📍</span>
                <div>
                  <p className="font-bold text-slate-800">Hospital Address</p>
                  <p className="text-sm">45 Medical Center Avenue, Sector 12, Delhi, India - 110001</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <span className="text-2xl mt-0.5">📞</span>
                <div>
                  <p className="font-bold text-slate-800">Phone Numbers</p>
                  <p className="text-sm">Emergency: +91 1800 234 5678</p>
                  <p className="text-sm">General Desk: +91 011 2345 6789</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <span className="text-2xl mt-0.5">✉️</span>
                <div>
                  <p className="font-bold text-slate-800">Email Addresses</p>
                  <p className="text-sm">support@medxpert.com</p>
                  <p className="text-sm">appointments@medxpert.com</p>
                </div>
              </div>
            </div>

            {/* Embedded Google Maps link */}
            <div className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden h-[250px] relative bg-slate-200">
              <iframe
                title="Hospital Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d112089.47953245207!2d77.12154441584988!3d28.605929965614917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x37205b715389640!2sDelhi!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-full border-0 grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Column 2: Booking form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-100 relative">
            <h4 className="text-2xl font-bold text-slate-900 mb-6">
              Request an Appointment
            </h4>

            {submitted ? (
              <div className="h-[350px] flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h5 className="text-xl font-bold text-slate-800">Appointment Request Received!</h5>
                <p className="text-slate-600 max-w-sm">
                  Thank you, <strong>{formData.name}</strong>. Our receptionist will call your number (<strong>{formData.phone}</strong>) within 30 minutes to confirm your slot.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full name input */}
                <div className="form-group">
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Email input */}
                  <div className="form-group">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="yourname@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Phone input */}
                  <div className="form-group">
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 transition-all duration-200"
                      required
                    />
                  </div>

                </div>

                {/* Specialty dropdown select */}
                <div className="form-group">
                  <label htmlFor="specialty" className="block text-sm font-semibold text-slate-700 mb-1">Specialty Department</label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 cursor-pointer transition-all duration-200"
                  >
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Radiology</option>
                    <option>Neurology</option>
                    <option>Dental Care</option>
                    <option>ICU Care</option>
                    <option>Orthopedic</option>
                  </select>
                </div>

                {/* Symptoms notes */}
                <div className="form-group">
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">Symptoms or Notes (Optional)</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Briefly describe your symptoms or special instructions..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 text-sm text-slate-800 resize-none transition-all duration-200"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-200"
                >
                  Send Booking Request
                </button>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
