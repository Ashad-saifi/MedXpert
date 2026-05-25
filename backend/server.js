import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount modular Mongoose database routes
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);

// Mock In-Memory Database State
let patients = [
  {
    id: "P-10421",
    name: "Alex Smith",
    email: "alex@email.com",
    phone: "+91 98765 43210",
    dob: "1988-03-14",
    bloodType: "O+",
    city: "Meerut, UP",
    allergies: "Penicillin, Dust",
    conditions: "Type 2 Diabetes",
    height: "175 cm",
    weight: "72 kg",
    bmi: "23.5 – Normal",
    insurance: { provider: "StarHealth", policyNo: "SH-204881", validUntil: "2026-12" },
    emergencyContact: { name: "Priya Smith", relation: "Spouse", phone: "+91 98765 00000" },
    clinicalNotes: "",
    chiefComplaint: ""
  },
  {
    id: "P-10388",
    name: "Priya Verma",
    email: "priya@email.com",
    phone: "+91 98765 00001",
    dob: "1997-08-22",
    bloodType: "A+",
    city: "Delhi",
    allergies: "None",
    conditions: "Fever (Acute)",
    height: "162 cm",
    weight: "58 kg",
    bmi: "22.1 – Normal",
    insurance: { provider: "HDFC Ergo", policyNo: "HE-904128", validUntil: "2027-04" },
    emergencyContact: { name: "Rohan Verma", relation: "Father", phone: "+91 98765 11111" },
    clinicalNotes: "",
    chiefComplaint: ""
  },
  {
    id: "P-10445",
    name: "Mohit Singh",
    email: "mohit@email.com",
    phone: "+91 98765 00002",
    dob: "1974-11-05",
    bloodType: "B+",
    city: "Noida, UP",
    allergies: "Sulfa drugs",
    conditions: "Hypertension",
    height: "180 cm",
    weight: "88 kg",
    bmi: "27.2 – Overweight",
    insurance: { provider: "Niva Bupa", policyNo: "NB-334211", validUntil: "2026-09" },
    emergencyContact: { name: "Suman Singh", relation: "Spouse", phone: "+91 98765 22222" },
    clinicalNotes: "",
    chiefComplaint: ""
  },
  {
    id: "P-10299",
    name: "Rahul Sharma",
    email: "rahul@email.com",
    phone: "+91 98765 00003",
    dob: "1981-05-19",
    bloodType: "AB-",
    city: "Meerut, UP",
    allergies: "Peanuts",
    conditions: "Hypertension",
    height: "170 cm",
    weight: "79 kg",
    bmi: "27.3 – Overweight",
    insurance: { provider: "StarHealth", policyNo: "SH-556128", validUntil: "2027-01" },
    emergencyContact: { name: "Anju Sharma", relation: "Mother", phone: "+91 98765 33333" },
    clinicalNotes: "",
    chiefComplaint: ""
  }
];

let doctors = [
  { id: "D-101", name: "Dr. Sarah Johnson", email: "sarah@hospital.com", specialty: "General Medicine", exp: "12 yrs", degree: "MBBS, MD", availability: "Mon-Fri (9AM-5PM)", fee: 500, rating: 4.9, consultationsCount: 1284, status: "Active", specializations: ["General Medicine", "Diabetes Management", "Preventive Care", "Hypertension"] },
  { id: "D-102", name: "Dr. Raj Patel", email: "raj@heartinstitute.com", specialty: "Cardiology", exp: "18 yrs", degree: "MBBS, DM", availability: "Tue-Sat (10AM-6PM)", fee: 800, rating: 4.8, consultationsCount: 742, status: "Active", specializations: ["Cardiology", "Heart Failure", "Interventional Cardiology"] },
  { id: "D-103", name: "Dr. Neha Kim", email: "neha@diabetesclinic.com", specialty: "Endocrinology", exp: "9 yrs", degree: "MBBS, MD", availability: "Mon-Thu (9AM-4PM)", fee: 600, rating: 4.7, consultationsCount: 518, status: "Active", specializations: ["Endocrinology", "Thyroid Disorders", "Diabetes T1 & T2"] },
  { id: "D-104", name: "Dr. Arun Mehta", email: "arun@neurocenter.com", specialty: "Neurology", exp: "15 yrs", degree: "MBBS, DNB", availability: "Mon/Wed/Fri (11AM-5PM)", fee: 900, rating: 4.9, consultationsCount: 481, status: "Active", specializations: ["Neurology", "Stroke Therapy", "Migraine Care"] },
  { id: "D-105", name: "Dr. Kavita Rao", email: "kavita@clinic.com", specialty: "Dermatology", exp: "5 yrs", degree: "MBBS, MD", availability: "Tue/Thu (2PM-7PM)", fee: 700, rating: 4.6, consultationsCount: 0, status: "Pending", specializations: ["Dermatology", "Acne & Scarring", "Laser Treatments"] }
];

let appointments = [
  { id: "A-501", patientName: "Alex Smith", patientId: "P-10421", doctorName: "Dr. Sarah Johnson", doctorId: "D-101", dateTime: "2026-05-23T10:30:00", type: "Video", status: "Confirmed", reason: "General Consult" },
  { id: "A-502", patientName: "Alex Smith", patientId: "P-10421", doctorName: "Dr. Raj Patel", doctorId: "D-102", dateTime: "2026-06-03T14:00:00", type: "In-Clinic", status: "Confirmed", reason: "Follow-up – Cardiology" },
  { id: "A-503", patientName: "Priya Verma", patientId: "P-10388", doctorName: "Dr. Sarah Johnson", doctorId: "D-101", dateTime: "2026-05-23T11:30:00", type: "In-Clinic", status: "Upcoming", reason: "Fever, Cough" },
  { id: "A-504", patientName: "Mohit Singh", patientId: "P-10445", doctorName: "Dr. Sarah Johnson", doctorId: "D-101", dateTime: "2026-05-23T14:00:00", type: "Video", status: "Upcoming", reason: "Rx Renewal" },
  { id: "A-505", patientName: "Rahul Sharma", patientId: "P-10299", doctorName: "Dr. Sarah Johnson", doctorId: "D-101", dateTime: "2026-05-23T09:00:00", type: "In-Clinic", status: "Completed", reason: "Hypertension FU" }
];

let prescriptions = [
  { id: "RX-201", patientName: "Alex Smith", patientId: "P-10421", doctorName: "Dr. Raj Patel", medicineName: "Metformin 500mg", dosage: "Twice daily – Morning & Evening", duration: "3 months", date: "2026-05-10", refillsTotal: 3, refillsUsed: 1, status: "Active" },
  { id: "RX-202", patientName: "Alex Smith", patientId: "P-10421", doctorName: "Dr. Sarah Johnson", medicineName: "Atorvastatin 10mg", dosage: "Once daily – Bedtime", duration: "6 months", date: "2026-04-22", refillsTotal: 6, refillsUsed: 2, status: "Active" },
  { id: "RX-203", patientName: "Alex Smith", patientId: "P-10421", doctorName: "Dr. Neha Kim", medicineName: "Vitamin D3 1000IU", dosage: "Once daily – Morning", duration: "3 months", date: "2026-05-15", refillsTotal: 3, refillsUsed: 3, status: "Refill Soon" },
  { id: "RX-204", patientName: "Rahul Sharma", patientId: "P-10299", doctorName: "Dr. Sarah Johnson", medicineName: "Amlodipine 5mg", dosage: "OD Morning", duration: "3 months", date: "2026-05-19", refillsTotal: 3, refillsUsed: 0, status: "Active" },
  { id: "RX-205", patientName: "Mohit Singh", patientId: "P-10445", doctorName: "Dr. Sarah Johnson", medicineName: "Telmisartan 40mg", dosage: "OD Morning", duration: "3 months", date: "2026-04-30", refillsTotal: 3, refillsUsed: 0, status: "Active" }
];

let labReports = [
  { id: "L-301", patientId: "P-10421", testName: "Complete Blood Count", date: "2026-05-15", lab: "CityPath Lab", result: "Normal", status: "Reviewed" },
  { id: "L-302", patientId: "P-10421", testName: "HbA1c", date: "2026-05-15", lab: "CityPath Lab", result: "6.8% – Borderline", status: "Action Required" },
  { id: "L-303", patientId: "P-10421", testName: "Lipid Panel", date: "2026-05-15", lab: "CityPath Lab", result: "Normal", status: "Reviewed" },
  { id: "L-304", patientId: "P-10421", testName: "Thyroid (TSH)", date: "2026-03-10", lab: "MedLab", result: "Normal", status: "Reviewed" },
  { id: "L-305", patientId: "P-10421", testName: "Vitamin B12", date: "2026-02-05", lab: "CityPath Lab", result: "Low – 178 pg/mL", status: "Reviewed" }
];

let activityLogs = [
  { time: "10:32:18", user: "Dr. Sarah Johnson", action: "Started video consultation with P-10421", ip: "192.168.1.42", status: "Success" },
  { time: "10:29:44", user: "Alex Smith", action: "Logged in to patient portal", ip: "203.90.1.18", status: "Success" },
  { time: "10:15:02", user: "System", action: "Automated backup completed", ip: "Internal", status: "Success" },
  { time: "09:58:11", user: "Dr. Sarah Johnson", action: "Issued prescription – Amlodipine 5mg", ip: "192.168.1.42", status: "Success" },
  { time: "09:44:30", user: "Unknown", action: "Failed login attempt", ip: "45.33.112.9", status: "Failed" }
];

let systemSettings = {
  platformName: "MedXpert",
  supportEmail: "support@medxpert.com",
  defaultDuration: "30 minutes",
  maxPatientsPerDay: 20,
  twoFAEnabled: true,
  sessionTimeoutEnabled: true,
  auditLoggingEnabled: true,
  e2eEncryptionEnabled: true
};

// Log Utility Helper
function addLog(user, action, status = "Success", ip = "127.0.0.1") {
  const time = new Date().toTimeString().split(' ')[0];
  activityLogs.unshift({ time, user, action, ip, status });
  if (activityLogs.length > 50) activityLogs.pop();
}

// REST APIs
// ── AUTHENTICATION ──
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  
  // Basic validation bypass for demo credentials
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing login details" });
  }
  
  addLog(role === 'admin' ? 'Admin' : role === 'doctor' ? 'Dr. Sarah Johnson' : 'Alex Smith', `Logged in to ${role} portal`);
  
  return res.json({
    success: true,
    message: "Login successful",
    user: {
      email,
      role,
      name: role === 'admin' ? 'Admin' : role === 'doctor' ? 'Dr. Sarah Johnson' : 'Alex Smith',
      id: role === 'admin' ? 'A-001' : role === 'doctor' ? 'D-101' : 'P-10421'
    }
  });
});

// ── PATIENT APIS ──
app.get('/api/patients/:id', (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json(patient);
});

app.put('/api/patients/:id/profile', (req, res) => {
  const index = patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Patient not found" });
  
  patients[index] = { ...patients[index], ...req.body };
  addLog(patients[index].name, "Updated profile personal details");
  res.json({ success: true, message: "Profile updated successfully", patient: patients[index] });
});

app.put('/api/patients/:id/clinical-notes', (req, res) => {
  const index = patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Patient not found" });
  
  patients[index].clinicalNotes = req.body.clinicalNotes || "";
  patients[index].chiefComplaint = req.body.chiefComplaint || "";
  addLog("Dr. Sarah Johnson", `Updated clinical notes for ${patients[index].name}`);
  res.json({ success: true, message: "Clinical notes updated successfully", patient: patients[index] });
});

app.get('/api/patients', (req, res) => {
  res.json(patients);
});

// ── DOCTOR APIS ──
app.get('/api/doctors', (req, res) => {
  res.json(doctors);
});

app.post('/api/doctors/approve/:id', (req, res) => {
  const doc = doctors.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Doctor not found" });
  doc.status = "Active";
  addLog("Admin", `Approved doctor credentials for ${doc.name}`);
  res.json({ success: true, message: "Doctor approved", doctors });
});

app.post('/api/doctors/reject/:id', (req, res) => {
  doctors = doctors.filter(d => d.id !== req.params.id);
  addLog("Admin", `Rejected doctor application ID: ${req.params.id}`);
  res.json({ success: true, message: "Doctor application rejected", doctors });
});

// ── APPOINTMENT APIS ──
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments/book', (req, res) => {
  const { doctorId, patientId, dateTime, type, reason } = req.body;
  const doc = doctors.find(d => d.id === doctorId || d.name.includes(doctorId));
  const pat = patients.find(p => p.id === patientId || p.id === "P-10421"); // default patient
  
  if (!doc) return res.status(400).json({ error: "Invalid doctor selected" });

  const newAppt = {
    id: `A-${500 + appointments.length + 1}`,
    patientName: pat ? pat.name : "Alex Smith",
    patientId: pat ? pat.id : "P-10421",
    doctorName: doc.name,
    doctorId: doc.id,
    dateTime: dateTime || new Date().toISOString(),
    type: type || "Video",
    status: "Confirmed",
    reason: reason || "General Consult"
  };

  appointments.push(newAppt);
  addLog(pat ? pat.name : "Alex Smith", `Booked appointment with ${doc.name} (${type})`);
  res.json({ success: true, message: "Appointment booked successfully", appointments });
});

app.post('/api/appointments/cancel/:id', (req, res) => {
  const appt = appointments.find(a => a.id === req.params.id);
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  appt.status = "Cancelled";
  addLog(appt.patientName, `Cancelled appointment with ${appt.doctorName}`);
  res.json({ success: true, message: "Appointment cancelled successfully", appointments });
});

// ── PRESCRIPTIONS APIS ──
app.get('/api/prescriptions', (req, res) => {
  res.json(prescriptions);
});

app.post('/api/prescriptions/issue', (req, res) => {
  const { patientId, diagnosis, medicines } = req.body;
  const pat = patients.find(p => p.id === patientId);
  if (!pat) return res.status(400).json({ error: "Invalid patient selected" });
  
  const createdRx = [];
  medicines.forEach(med => {
    const newRx = {
      id: `RX-${200 + prescriptions.length + 1}`,
      patientName: pat.name,
      patientId: pat.id,
      doctorName: "Dr. Sarah Johnson",
      medicineName: med.name,
      dosage: med.dosage || "1 tablet daily",
      duration: req.body.duration || "7 days",
      date: new Date().toISOString().split('T')[0],
      refillsTotal: req.body.duration === '3 months' ? 3 : 1,
      refillsUsed: 0,
      status: "Active"
    };
    prescriptions.push(newRx);
    createdRx.push(newRx);
  });
  
  addLog("Dr. Sarah Johnson", `Issued prescription for ${pat.name} - ${diagnosis}`);
  res.json({ success: true, message: "Prescription issued and sent to patient", prescriptions });
});

// ── LAB REPORTS ──
app.get('/api/reports', (req, res) => {
  res.json(labReports);
});

app.post('/api/reports/upload', (req, res) => {
  const { testName, patientId, lab } = req.body;
  const newReport = {
    id: `L-${300 + labReports.length + 1}`,
    patientId: patientId || "P-10421",
    testName: testName || "Blood Test",
    date: new Date().toISOString().split('T')[0],
    lab: lab || "CityPath Lab",
    result: "Normal",
    status: "Reviewed"
  };
  labReports.push(newReport);
  addLog("Alex Smith", `Uploaded lab report: ${testName}`);
  res.json({ success: true, message: "Report uploaded successfully", labReports });
});

// ── ADMIN SETTINGS & UTILS ──
app.get('/api/admin/logs', (req, res) => {
  res.json({
    logs: activityLogs,
    settings: systemSettings,
    stats: {
      totalPatients: patients.length + 3838, // matching design count
      activeDoctors: doctors.filter(d => d.status === 'Active').length + 120, // matching design count
      consultationsToday: 287,
      uptime: "99.8%"
    }
  });
});

app.put('/api/admin/settings', (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  addLog("Admin", "Modified system platform configurations");
  res.json({ success: true, message: "Settings saved successfully", settings: systemSettings });
});

app.post('/api/admin/users/suspend/:id', (req, res) => {
  addLog("Admin", `Suspended user ID: ${req.params.id}`);
  res.json({ success: true, message: "User suspended successfully" });
});

app.post('/api/admin/users/add', (req, res) => {
  const { firstName, lastName, email, role, phone } = req.body;
  const fullName = `${firstName} ${lastName}`;
  
  if (role === 'Doctor') {
    doctors.push({
      id: `D-${100 + doctors.length + 1}`,
      name: `Dr. ${fullName}`,
      email,
      specialty: "General Medicine",
      exp: "0 yrs",
      degree: "MBBS",
      availability: "Mon-Fri",
      fee: 500,
      rating: 5.0,
      consultationsCount: 0,
      status: "Active",
      specializations: ["General Medicine"]
    });
  } else {
    patients.push({
      id: `P-${10000 + patients.length + 1}`,
      name: fullName,
      email,
      phone,
      dob: "1990-01-01",
      bloodType: "O+",
      city: "Unknown",
      allergies: "None",
      conditions: "None",
      height: "–",
      weight: "–",
      bmi: "–",
      insurance: { provider: "None", policyNo: "None", validUntil: "–" },
      emergencyContact: { name: "None", relation: "–", phone: "–" }
    });
  }
  
  addLog("Admin", `Added new user: ${fullName} (${role})`);
  res.json({ success: true, message: "User added and invitation sent" });
});

app.listen(PORT, () => {
  console.log(`MedXpert backend server running on http://localhost:${PORT}`);
});
