import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import ActivityLog from "../models/ActivityLog.js";
import { signPrescription, verifyPrescription } from "../cryptoHelper.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all prescriptions
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({});
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Issue a new prescription with cryptographic signature
// @route   POST /api/prescriptions/issue
// @access  Private/Doctor
const issuePrescription = async (req, res) => {
    try {
        const { patientId, diagnosis, medicines } = req.body;

        const patient = await Patient.findOne({ id: patientId });
        if (!patient) {
            return res.status(400).json({ error: "Invalid patient selected" });
        }

        // Hardcode active doctor context or find one
        const doctor = await Doctor.findOne({ id: "D-101" }) || await Doctor.findOne({});
        const doctorName = doctor ? doctor.name : "Dr. Shreya Joshi";
        const doctorObjectId = doctor ? doctor._id : null;

        const count = await Prescription.countDocuments();
        let indexOffset = 1;

        const createdPrescriptions = [];
        for (const med of medicines) {
            const nextRxId = `RX-${200 + count + indexOffset}`;
            indexOffset++;

            const dateStr = new Date().toISOString().split('T')[0];
            const doseStr = med.dosage || "1 tablet daily";
            const durationStr = req.body.duration || "7 days";

            // Compile the unique data string for cryptographic signature
            const rxData = `${med.name}|${doseStr}|${patient.id}|${dateStr}|${nextRxId}`;
            const signature = signPrescription(rxData);

            const prescription = await Prescription.create({
                id: nextRxId,
                patient: patient._id,
                doctor: doctorObjectId,
                patientId: patient.id,
                patientName: patient.name,
                doctorName: doctorName,
                medicineName: med.name,
                dosage: doseStr,
                duration: durationStr,
                date: dateStr,
                refillsTotal: req.body.duration === '3 months' ? 3 : 1,
                refillsUsed: 0,
                status: "Active",
                signature: signature
            });
            createdPrescriptions.push(prescription);
        }

        await addLog(doctorName, `Issued prescription for ${patient.name} - ${diagnosis}`);

        const allPrescriptions = await Prescription.find({});
        res.json({ success: true, message: "Prescription issued and sent to patient", prescriptions: allPrescriptions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download prescription as a signed PDF with QR Code verification
// @route   GET /api/prescriptions/:id/download
// @access  Public
const downloadPrescriptionPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const rx = await Prescription.findOne({ id });

        if (!rx) {
            return res.status(404).send("Prescription not found.");
        }

        // Setup PDF headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=prescription_${id}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // Official clinical brand styles
        const primaryColor = "#0f172a"; // Deep Slate
        const secondaryColor = "#0284c7"; // Sky Blue
        const textColor = "#334155"; // Charcoal
        const lightBg = "#f8fafc"; // Very Light Slate

        // Title Block & Header Banner
        doc.rect(0, 0, 612, 100).fill(primaryColor);
        doc.fillColor("#ffffff")
           .font("Helvetica-Bold")
           .fontSize(22)
           .text("MEDXPERT TELEMEDICINE CLINIC", 50, 35, { characterSpacing: 1 });
        doc.font("Helvetica")
           .fontSize(10)
           .text("ADVANCED EHR & DIGITAL HEALTH SERVICES", 50, 60, { characterSpacing: 1.5 });

        // Hospital/Clinic details in top right corner
        doc.fillColor("#ffffff")
           .fontSize(8)
           .text("Email: care@medxpert.com", 430, 35, { align: "right" })
           .text("Support: +1 (800) 555-0199", 430, 48, { align: "right" })
           .text("Website: medxpert.health", 430, 61, { align: "right" });

        doc.moveDown(4);

        // Document Details (Grid-like Block)
        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(12).text("DIGITAL PRESCRIPTION RECORD", 50, 125);
        doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, 142).lineTo(562, 142).stroke();

        // Details metadata container box
        doc.rect(50, 155, 512, 85).fill(lightBg);
        doc.fillColor(textColor).font("Helvetica-Bold").fontSize(9);
        
        // Col 1
        doc.text("Prescription ID:", 65, 170)
           .text("Issue Date:", 65, 190)
           .text("Clinical Status:", 65, 210);

        doc.font("Helvetica");
        doc.text(rx.id, 160, 170)
           .text(rx.date, 160, 190)
           .fillColor(secondaryColor).font("Helvetica-Bold").text(rx.status.toUpperCase(), 160, 210);

        // Col 2
        doc.fillColor(textColor).font("Helvetica-Bold");
        doc.text("Patient Name:", 300, 170)
           .text("Patient ID:", 300, 190)
           .text("Authorized Doctor:", 300, 210);

        doc.font("Helvetica");
        doc.text(rx.patientName, 400, 170)
           .text(rx.patientId, 400, 190)
           .text(rx.doctorName, 400, 210);

        doc.moveDown(3);

        // Rx Symbol and Treatment Area
        doc.strokeColor(secondaryColor).lineWidth(1.5).moveTo(50, 265).lineTo(562, 265).stroke();
        doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(26).text("Rx", 50, 280);

        // Medicine Card Display Box
        doc.rect(50, 315, 512, 110).fill(lightBg);
        doc.rect(50, 315, 5, 110).fill(secondaryColor); // highlight accent

        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(14).text(rx.medicineName, 75, 335);
        doc.fillColor(textColor).font("Helvetica-Oblique").fontSize(10).text(`Dosage instructions: ${rx.dosage}`, 75, 360);
        doc.font("Helvetica").fontSize(10).text(`Duration of Treatment: ${rx.duration}`, 75, 380);
        doc.text(`Available Refills: ${rx.refillsTotal - rx.refillsUsed} refills remaining (out of ${rx.refillsTotal} authorized)`, 75, 400);

        doc.moveDown(4);

        // Security & Verification Division
        doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, 455).lineTo(562, 455).stroke();

        // Generate QR code link dynamically
        const protocol = req.secure ? "https" : "http";
        const verifyUrl = `${protocol}://${req.get("host")}/api/prescriptions/verify/${rx.id}`;
        const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 90 });

        // Draw QR code and signature info side-by-side
        doc.image(qrBuffer, 50, 475, { width: 90 });

        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(10).text("E-SIGNATURE CRYPTOGRAPHIC VERIFICATION", 155, 480);
        doc.fillColor(textColor).font("Helvetica").fontSize(8)
           .text("This official clinical document is cryptographically signed using an RSA-SHA256 private key held securely by the server. Scan the verification QR code or visit the verification portal to ensure validity.", 155, 497, { width: 400, align: "justify" });
        
        doc.font("Courier").fontSize(6.5).fillColor("#64748b")
           .text(`RSA-SIGN: ${rx.signature ? rx.signature.substring(0, 75) + "..." : "UNAVAILABLE"}`, 155, 537);

        // Footer terms
        doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(50, 580).lineTo(562, 580).stroke();
        doc.fillColor("#94a3b8").font("Helvetica").fontSize(7)
           .text("MedXpert health systems comply with active HIPAA privacy regulations and medical transaction integrity protocols. Any alteration of this document invalidates its signature and constitutes severe clinical forgery.", 50, 595, { align: "center", width: 512 });

        doc.end();
    } catch (error) {
        console.error("PDF generation failed:", error);
        res.status(500).send("Failed to compile prescription PDF.");
    }
};

// @desc    Verify prescription digital signature via styled browser UI
// @route   GET /api/prescriptions/verify/:id
// @access  Public
const verifyPrescriptionSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const rx = await Prescription.findOne({ id });

        if (!rx) {
            return res.status(404).send(`
                <html>
                <head>
                    <title>MedXpert Verification Error</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 20px; text-align: center; max-width: 400px; }
                        h1 { color: #f43f5e; margin-bottom: 0.5rem; }
                        p { color: #94a3b8; line-height: 1.5; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>⚠️ Record Not Found</h1>
                        <p>The prescription ID <strong>${id}</strong> was not found in the database. The document may be counterfeit or revoked.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Recompile unique data string and check signature validity
        const rxData = `${rx.medicineName}|${rx.dosage}|${rx.patientId}|${rx.date}|${rx.id}`;
        const isValid = verifyPrescription(rxData, rx.signature || "");

        // Build premium HSL tailored design verification page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>MedXpert Cryptographic Verification</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    :root {
                        --bg-slate: #0f172a;
                        --primary: #0284c7;
                        --success: #10b981;
                        --warning: #f59e0b;
                        --text: #f8fafc;
                        --text-muted: #94a3b8;
                    }
                    body {
                        background-color: var(--bg-slate);
                        color: var(--text);
                        font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 1.5rem;
                        box-sizing: border-box;
                    }
                    .glass-container {
                        background: rgba(30, 41, 59, 0.7);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        border-radius: 24px;
                        padding: 2.5rem;
                        width: 100%;
                        max-width: 550px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                        text-align: center;
                        animation: fadeInUp 0.6s ease-out;
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .badge-shield {
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 1.5rem;
                        background: ${isValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px dashed ${isValid ? 'var(--success)' : 'var(--warning)'};
                    }
                    .badge-shield span {
                        font-size: 2.5rem;
                        color: ${isValid ? 'var(--success)' : 'var(--warning)'};
                    }
                    h1 {
                        font-size: 1.75rem;
                        font-weight: 700;
                        margin: 0 0 0.5rem;
                        color: ${isValid ? 'var(--success)' : 'var(--warning)'};
                    }
                    .status-tag {
                        font-size: 0.75rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: var(--text-muted);
                        margin-bottom: 2rem;
                    }
                    .detail-grid {
                        text-align: left;
                        background: rgba(15, 23, 42, 0.4);
                        border-radius: 16px;
                        padding: 1.5rem;
                        border: 1px solid rgba(255,255,255,0.03);
                        margin-bottom: 2rem;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        color: var(--text-muted);
                        font-size: 0.85rem;
                    }
                    .detail-val {
                        font-weight: 600;
                        font-size: 0.9rem;
                        color: var(--text);
                    }
                    .signature-block {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 0.65rem;
                        background: #090d16;
                        color: #64748b;
                        padding: 0.75rem;
                        border-radius: 8px;
                        word-break: break-all;
                        text-align: left;
                        margin-bottom: 2rem;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    .btn-back {
                        display: inline-block;
                        text-decoration: none;
                        background: var(--primary);
                        color: white;
                        font-weight: 600;
                        font-size: 0.9rem;
                        padding: 0.75rem 2rem;
                        border-radius: 50px;
                        transition: transform 0.2s, background-color 0.2s;
                    }
                    .btn-back:hover {
                        background-color: #0369a1;
                        transform: translateY(-1px);
                    }
                </style>
            </head>
            <body>
                <div class="glass-container">
                    <div class="badge-shield">
                        <span>${isValid ? '✓' : '⚠'}</span>
                    </div>
                    <h1>${isValid ? 'Prescription Verified' : 'Signature Unverified'}</h1>
                    <div class="status-tag">${isValid ? 'Authentic Medical Document' : 'Verification Exception'}</div>

                    <div class="detail-grid">
                        <div class="detail-row">
                            <span class="detail-label">Prescription ID</span>
                            <span class="detail-val">${rx.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Medicine Prescribed</span>
                            <span class="detail-val" style="color: var(--primary);">${rx.medicineName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Dosage Instruction</span>
                            <span class="detail-val">${rx.dosage}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Treatment Duration</span>
                            <span class="detail-val">${rx.duration}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Patient Name</span>
                            <span class="detail-val">${rx.patientName} (ID: ${rx.patientId})</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Prescribing Physician</span>
                            <span class="detail-val">${rx.doctorName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date of Issue</span>
                            <span class="detail-val">${rx.date}</span>
                        </div>
                    </div>

                    <div class="status-tag" style="margin-bottom:0.5rem; text-align:left;">Digital Public-Key RSA Signature</div>
                    <div class="signature-block">
                        ${rx.signature || "NO SIGNATURE DETECTED"}
                    </div>

                    <a href="javascript:window.close();" class="btn-back">Close Portal</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Verification failed:", error);
        res.status(500).send("Verification processing crashed.");
    }
};

export {
    getPrescriptions,
    issuePrescription,
    downloadPrescriptionPDF,
    verifyPrescriptionSignature
};
