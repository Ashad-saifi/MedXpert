# MedXpert – Production Roadmap & Enhancements

This document outlines the architectural enhancements recommended for transitioning the current mock-based development setup of MedXpert into a production-grade digital health platform.

---

## 🔒 1. Production Authentication (JWT + HTTP-Only Cookies)
Currently, login credentials are validated via simple string matches in memory.
- **Enhancement**: Integrate passport or jsonwebtoken (JWT).
- **Implementation Strategy**:
  - Securely hash user passwords using `bcryptjs` before storing them.
  - On login, generate a JWT containing user IDs and role claims.
  - Deliver token records inside an `httpOnly` secure cookie to mitigate Cross-Site Scripting (XSS) risks.
  - Create Express middleware to verify tokens and role privileges:
    ```javascript
    function verifyRole(roles) {
      return (req, res, next) => {
        // extract user token details, verify and call next()
      };
    }
    ```

---

## 🗄️ 2. Persistent Database Integration (PostgreSQL or MongoDB)
Currently, all database state resets whenever the Express process restarts.
- **Enhancement**: Integrate Object-Relational/Document Mapping databases.
- **Implementation Strategy**:
  - For structured health data, implement **PostgreSQL** with **Prisma** or **Sequelize** ORM to handle data relations (e.g., Doctors have many Appointments, Patients have many Prescriptions).
  - For flexible medical files and logs, use **MongoDB** with **Mongoose**.
  - Secure databases by routing connections using environment parameters (`process.env.DATABASE_URL`).

---

## 🎥 3. Real WebRTC + Socket.io Video Streaming
Currently, the telehealth consultation room simulates connections using frontend CSS animations and visual timers.
- **Enhancement**: Add peer-to-peer audio and video streaming.
- **Implementation Strategy**:
  - Set up a **Socket.io** server on the backend to act as a signaling server.
  - Utilize client-side `RTCPeerConnection` APIs to exchange ICE candidates and SDP parameters between the Patient and Doctor browsers.
  - Integrate STUN/TURN server endpoints (e.g., via Twilio or Xirsys) to handle network translation and ensure reliable connections across firewalls.

---

## 🧪 4. Secure EHR File Storage (AWS S3 / Google Cloud Storage)
Currently, uploading lab reports simulates adding JSON entries to local arrays.
- **Enhancement**: Implement cloud storage for files.
- **Implementation Strategy**:
  - Integrate backend file parsing using `multer` middleware.
  - Configure cloud storage SDKs (such as `@aws-sdk/client-s3`) to upload document payloads to private storage buckets.
  - Issue temporary, pre-signed URLs to patients and authorized doctors when viewing files, ensuring medical documents are never exposed publicly.
