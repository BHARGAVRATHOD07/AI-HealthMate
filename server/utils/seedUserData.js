const Vital = require("../models/Vital");
const Medication = require("../models/Medication");
const Reminder = require("../models/Reminder");
const Record = require("../models/Record");

/**
 * Seed initial sample health data for a user if they don't have any yet
 */
const seedUserData = async (userId) => {
    try {
        // 1. Check vitals
        const vitalCount = await Vital.countDocuments({ user: userId });
        if (vitalCount === 0) {
            await Vital.insertMany([
                { user: userId, type: "Blood Pressure", value: "118/78", unit: "mmHg", status: "Normal", notes: "Morning reading" },
                { user: userId, type: "Heart Rate", value: "72", unit: "bpm", status: "Normal", notes: "Resting" },
                { user: userId, type: "Blood Sugar", value: "95", unit: "mg/dL", status: "Normal", notes: "Fasting" },
                { user: userId, type: "Weight", value: "68.5", unit: "kg", status: "Normal", notes: "Post-workout" },
                { user: userId, type: "Oxygen Level", value: "98", unit: "%", status: "Normal", notes: "SpO2" },
                { user: userId, type: "Temperature", value: "98.6", unit: "°F", status: "Normal", notes: "Oral" }
            ]);
        }

        // 2. Check medications
        const medCount = await Medication.countDocuments({ user: userId });
        if (medCount === 0) {
            await Medication.insertMany([
                { user: userId, name: "Lisinopril", dosage: "10mg", frequency: "Once daily", timing: "Morning with water", prescribedBy: "Dr. Sarah Jenkins", refillsLeft: 3, totalRefills: 5, instructions: "Take every morning with food", status: "Active" },
                { user: userId, name: "Metformin", dosage: "500mg", frequency: "Twice daily", timing: "Morning & Evening", prescribedBy: "Dr. Sarah Jenkins", refillsLeft: 2, totalRefills: 4, instructions: "Take with meals", status: "Active" },
                { user: userId, name: "Atorvastatin", dosage: "20mg", frequency: "Once daily", timing: "At bedtime", prescribedBy: "Dr. Sarah Jenkins", refillsLeft: 4, totalRefills: 6, instructions: "Take before bed", status: "Active" },
                { user: userId, name: "Amoxicillin", dosage: "250mg", frequency: "3 times daily", timing: "After meals", prescribedBy: "Dr. Michael Ross", refillsLeft: 0, totalRefills: 0, instructions: "Course completed", status: "Completed" }
            ]);
        }

        // 3. Check reminders
        const reminderCount = await Reminder.countDocuments({ user: userId });
        if (reminderCount === 0) {
            await Reminder.insertMany([
                { user: userId, title: "Take Lisinopril (10mg)", category: "Medication", time: "08:00 AM", date: "Today", repeat: "Daily", completed: false, notes: "Morning dose with water" },
                { user: userId, title: "Log Blood Pressure Reading", category: "Vitals Check", time: "10:00 AM", date: "Today", repeat: "Daily", completed: true, notes: "Use digital cuff" },
                { user: userId, title: "Annual Cardiology Checkup", category: "Appointment", time: "02:30 PM", date: "Oct 12", repeat: "Once", completed: false, notes: "Dr. Sarah Jenkins at City Hospital" },
                { user: userId, title: "Fasting Blood Sugar Test", category: "Lab Test", time: "07:30 AM", date: "Oct 15", repeat: "Once", completed: false, notes: "Fast for 8 hours prior" }
            ]);
        }

        // 4. Check health records
        const recordCount = await Record.countDocuments({ user: userId });
        if (recordCount === 0) {
            await Record.insertMany([
                { user: userId, title: "Comprehensive Metabolic Panel (CMP)", category: "Lab Report", doctorName: "Dr. Sarah Jenkins", facility: "Quest Diagnostics", summary: "All liver and kidney parameters within standard physiological range.", status: "Final" },
                { user: userId, title: "Lipid Panel Results", category: "Lab Report", doctorName: "Dr. Sarah Jenkins", facility: "Quest Diagnostics", summary: "Total cholesterol: 185 mg/dL, HDL: 52 mg/dL, LDL: 110 mg/dL, Triglycerides: 115 mg/dL.", status: "Final" },
                { user: userId, title: "Echocardiogram Report", category: "Imaging", doctorName: "Dr. Michael Ross", facility: "City Health Hospital", summary: "Normal left ventricular ejection fraction (EF 62%). No significant valvular stenosis.", status: "Final" },
                { user: userId, title: "Annual Health Assessment Note", category: "Doctor Note", doctorName: "Dr. Sarah Jenkins", facility: "City Health Clinic", summary: "Patient in overall good health. BP controlled. Continue current medication regimen.", status: "Final" }
            ]);
        }
    } catch (err) {
        console.error("Error seeding user data:", err.message);
    }
};

module.exports = seedUserData;
