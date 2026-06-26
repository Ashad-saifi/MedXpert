import LabReport from "../models/LabReport.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import ActivityLog from "../models/ActivityLog.js";

const addLog = async (user, action, status = "Success", ip = "127.0.0.1") => {
    const time = new Date().toTimeString().split(' ')[0];
    await ActivityLog.create({ time, user, action, ip, status });
};

// @desc    Get all lab reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
    try {
        const reports = await LabReport.find({});
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload lab report
// @route   POST /api/reports/upload
// @access  Private
const uploadReport = async (req, res) => {
    try {
        const { testName, patientId, lab, result, status, pdfData, pdfName } = req.body;

        const patient = await Patient.findOne({ id: patientId || "P-10421" });
        const patientObjectId = patient ? patient._id : null;
        const finalPatientId = patient ? patient.id : "P-10421";
        const patientName = patient ? patient.name : "Aarav Mehta";

        const count = await LabReport.countDocuments();
        const nextId = `L-${300 + count + 1}`;

        const report = await LabReport.create({
            id: nextId,
            patient: patientObjectId,
            patientId: finalPatientId,
            testName: testName || "Blood Test",
            date: new Date().toISOString().split('T')[0],
            lab: lab || "CityPath Lab",
            result: result || "Normal",
            status: status || "Reviewed",
            pdfData: pdfData || "",
            pdfName: pdfName || ""
        });

        await addLog(patientName, `Uploaded lab report: ${testName || "Blood Test"}`);

        const allReports = await LabReport.find({});
        res.json({ success: true, message: "Report uploaded successfully", labReports: allReports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download all health records as a PDF report
// @route   GET /api/reports/download-all/:id
// @access  Public
const downloadAllRecordsPDF = async (req, res) => {
    try {
        const PDFDocument = (await import("pdfkit")).default;

        const { id } = req.params;
        const patient = await Patient.findOne({ id });

        if (!patient) {
            return res.status(404).send("Patient not found.");
        }

        const reports = await LabReport.find({ patientId: id }).sort({ date: -1 });
        const prescriptions = await Prescription.find({ patientId: id }).sort({ date: -1 });

        // Setup PDF headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=health_records_${id}.pdf`);

        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        doc.pipe(res);

        // Styling colors
        const primaryColor = "#0f172a"; // Deep Slate
        const secondaryColor = "#0284c7"; // Sky Blue
        const textColor = "#334155"; // Charcoal
        const lightBg = "#f8fafc"; // Very Light Slate
        const borderColor = "#e2e8f0";

        // Header banner
        doc.rect(0, 0, 612, 100).fill(primaryColor);
        doc.fillColor("#ffffff")
           .font("Helvetica-Bold")
           .fontSize(22)
           .text("MEDXPERT TELEMEDICINE CLINIC", 50, 35, { characterSpacing: 1 });
        doc.font("Helvetica")
           .fontSize(10)
           .text("COMPREHENSIVE ELECTRONIC HEALTH RECORD (EHR)", 50, 60, { characterSpacing: 1.5 });

        doc.fillColor("#ffffff")
           .fontSize(8)
           .text("Email: care@medxpert.com", 430, 35, { align: "right" })
           .text("Support: +91 1800 123 4567", 430, 48, { align: "right" })
           .text("Website: medxpert.health", 430, 61, { align: "right" });

        doc.moveDown(4);

        // Section 1: Patient Profile Summary
        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(14).text("PATIENT DEMOGRAPHICS & CLINICAL SUMMARY", 50, 125);
        doc.strokeColor(secondaryColor).lineWidth(1.5).moveTo(50, 142).lineTo(562, 142).stroke();

        doc.rect(50, 155, 512, 130).fill(lightBg);
        doc.fillColor(textColor).font("Helvetica-Bold").fontSize(9);

        // Demographics Details
        doc.text("Patient Name:", 65, 170).text("Patient ID:", 65, 185).text("Date of Birth / Age:", 65, 200).text("Gender:", 65, 215).text("Blood Type:", 65, 230);
        doc.font("Helvetica");
        doc.text(patient.name, 170, 170)
           .text(patient.id, 170, 185)
           .text(`${patient.dob || "N/A"} (${patient.age || "N/A"} years)`, 170, 200)
           .text(patient.gender || "Not Specified", 170, 215)
           .text(patient.bloodType || "N/A", 170, 230);

        doc.font("Helvetica-Bold");
        doc.text("Height / Weight:", 320, 170).text("City:", 320, 185).text("Chronic Conditions:", 320, 200).text("Allergies:", 320, 215).text("Emergency Contact:", 320, 230);
        doc.font("Helvetica");
        doc.text(`${patient.height || "N/A"} / ${patient.weight || "N/A"}`, 430, 170)
           .text(patient.city || "N/A", 430, 185)
           .text(patient.chronicConditions || "None", 430, 200)
           .text(patient.allergies || "None", 430, 215)
           .text(patient.emergencyContact ? `${patient.emergencyContact.name || "N/A"} (${patient.emergencyContact.relation || ""}) - ${patient.emergencyContact.phone || ""}` : "None", 430, 230);

        doc.moveDown(9);

        // Section 2: Active & History Prescriptions
        let currentY = doc.y + 15;
        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(14).text("PRESCRIPTIONS LOG", 50, currentY);
        currentY += 17;
        doc.strokeColor(secondaryColor).lineWidth(1.5).moveTo(50, currentY).lineTo(562, currentY).stroke();
        currentY += 15;

        if (prescriptions.length === 0) {
            doc.fillColor(textColor).font("Helvetica-Oblique").fontSize(10).text("No medication logs or prescriptions found on file.", 50, currentY);
            currentY += 20;
        } else {
            // Table Header
            doc.rect(50, currentY, 512, 20).fill(primaryColor);
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
            doc.text("Date", 60, currentY + 6);
            doc.text("Medicine Name", 130, currentY + 6);
            doc.text("Dosage", 250, currentY + 6);
            doc.text("Duration", 370, currentY + 6);
            doc.text("Doctor", 460, currentY + 6);
            currentY += 20;

            doc.font("Helvetica").fontSize(8.5).fillColor(textColor);
            prescriptions.forEach((rx, index) => {
                const bg = index % 2 === 0 ? "#ffffff" : lightBg;
                doc.rect(50, currentY, 512, 22).fill(bg);
                doc.fillColor(textColor);
                doc.text(rx.date || "N/A", 60, currentY + 7);
                doc.font("Helvetica-Bold").fillColor(primaryColor).text(rx.medicineName || "N/A", 130, currentY + 7).font("Helvetica").fillColor(textColor);
                doc.text(rx.dosage || "N/A", 250, currentY + 7);
                doc.text(rx.duration || "N/A", 370, currentY + 7);
                doc.text(rx.doctorName || "N/A", 460, currentY + 7);
                
                doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, currentY + 22).lineTo(562, currentY + 22).stroke();
                currentY += 22;
            });
        }

        // Section 3: Lab Reports History
        currentY += 25;
        doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(14).text("LABORATORY DIAGNOSTICS HISTORY", 50, currentY);
        currentY += 17;
        doc.strokeColor(secondaryColor).lineWidth(1.5).moveTo(50, currentY).lineTo(562, currentY).stroke();
        currentY += 15;

        if (reports.length === 0) {
            doc.fillColor(textColor).font("Helvetica-Oblique").fontSize(10).text("No diagnostic laboratory tests found on file.", 50, currentY);
            currentY += 20;
        } else {
            // Table Header
            doc.rect(50, currentY, 512, 20).fill(primaryColor);
            doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
            doc.text("Date", 60, currentY + 6);
            doc.text("Test Name", 130, currentY + 6);
            doc.text("Diagnostic Lab", 270, currentY + 6);
            doc.text("Summary Result", 400, currentY + 6);
            doc.text("Status", 500, currentY + 6);
            currentY += 20;

            doc.font("Helvetica").fontSize(8.5).fillColor(textColor);
            reports.forEach((rep, index) => {
                const bg = index % 2 === 0 ? "#ffffff" : lightBg;
                doc.rect(50, currentY, 512, 22).fill(bg);
                doc.fillColor(textColor);
                doc.text(rep.date || "N/A", 60, currentY + 7);
                doc.font("Helvetica-Bold").fillColor(primaryColor).text(rep.testName || "N/A", 130, currentY + 7).font("Helvetica").fillColor(textColor);
                doc.text(rep.lab || "N/A", 270, currentY + 7);
                doc.text(rep.result || "N/A", 400, currentY + 7);

                const statusColor = rep.status === "Action Required" ? "#ef4444" : "#10b981";
                doc.fillColor(statusColor).font("Helvetica-Bold").text(rep.status || "N/A", 500, currentY + 7).font("Helvetica").fillColor(textColor);
                
                doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, currentY + 22).lineTo(562, currentY + 22).stroke();
                currentY += 22;
            });
        }

        // Global footer terms
        doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(50, 700).lineTo(562, 700).stroke();
        doc.fillColor("#94a3b8").font("Helvetica").fontSize(7.5)
           .text("This consolidated Electronic Health Record (EHR) report is generated automatically by MedXpert Health Systems. Information contained is compiled directly from authorized provider uploads and active prescriptions. All records are compliant with standard clinical storage safety measures.", 50, 715, { align: "center", width: 512 });

        doc.end();
        await addLog(patient.name, "Downloaded complete health records PDF summary");
    } catch (error) {
        console.error("Health record PDF compile failed:", error);
        res.status(500).send("Failed to compile comprehensive health records PDF.");
    }
};

export {
    getReports,
    uploadReport,
    downloadAllRecordsPDF
};

