# 🏥 MedXpert - Telemedicine & Electronic Health Records Platform

## 📌 Overview

MedXpert is a full-stack healthcare management platform designed to simplify communication between Patients, Doctors, and Administrators through a centralized Telemedicine and Electronic Health Record (EHR) system.

The platform provides appointment scheduling, patient management, doctor management, prescription handling, medical reports, and secure healthcare record storage through dedicated role-based dashboards.

---

## 🚀 Features

### 👨‍⚕️ Doctor Portal
- Doctor Dashboard
- Patient Management
- Appointment Management
- Prescription Generation
- Medical Record Access
- Report Review

### 🧑‍🤝‍🧑 Patient Portal
- User Registration & Login
- Appointment Booking
- Doctor Search
- Medical History Tracking
- Prescription Viewing
- Report Management
- Profile Management

### 👨‍💼 Admin Portal
- User Management
- Doctor Management
- Patient Management
- Appointment Monitoring
- System Analytics
- Activity Tracking

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication & Security
- JWT Authentication
- Protected Routes
- Role-Based Access Control

### Version Control
- Git
- GitHub

---

## 📂 Project Structure

```text
MedXpert
│
├── backend
│   ├── config
│   ├── controllers
│   │   ├── adminController.js
│   │   ├── userController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── appointmentController.js
│   │   ├── prescriptionController.js
│   │   └── reportController.js
│   │
│   ├── middleware
│   ├── models
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   ├── Appointment.js
│   │   ├── Prescription.js
│   │   └── Report.js
│   │
│   ├── routes
│   ├── docs
│   └── server.js
│
├── src
├── public
├── package.json
├── vite.config.js
└── README.md
🗄️ Database Models
User
Name
Email
Password
Role
Doctor
Name
Specialization
Experience
Availability
Patient
Personal Details
Medical History
Contact Information
Appointment
Patient
Doctor
Appointment Date
Status
Prescription
Diagnosis
Medicines
Dosage
Instructions
Report
Report Type
Upload Information
Medical Findings
🔐 Authentication Flow
User Registration
User Login
JWT Token Generation
Protected Route Access
Role-Based Authorization
Supported Roles:
Admin
Doctor
Patient


👥 Contributors
Priyanka Vanga
Ashad Saifi
Siddhant Mohan Jha

📄 License
This project is developed for educational and internship purposes.
