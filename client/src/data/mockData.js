// Realistic Mock Data for AI HealthMate Frontend
// Clearly separated so components can seamlessly integrate with real APIs in the future.

export const initialProfileData = {
  fullName: "Alex Johnson",
  email: "alex.johnson@example.com",
  dateOfBirth: "1994-06-15",
  gender: "Male",
  phone: "+1 (555) 234-5678",
  address: "742 Evergreen Terrace, Springfield",
  
  // Health Information
  height: "178 cm",
  weight: "72 kg",
  bloodGroup: "O+",
  allergies: ["Penicillin", "Peanuts"],
  existingConditions: ["Mild Asthma", "Seasonal Allergies"],
  emergencyContact: {
    name: "Sarah Johnson",
    relation: "Spouse",
    phone: "+1 (555) 876-5432"
  }
};

export const initialHealthOverview = {
  healthScore: 92,
  statusLabel: "Optimal Health",
  metrics: [
    {
      id: "heartRate",
      name: "Heart Rate",
      value: "72",
      unit: "bpm",
      status: "Normal",
      statusColor: "emerald",
      icon: "Activity",
      change: "-2 bpm vs last week",
      targetRange: "60-100 bpm",
      lastUpdated: "Today, 8:30 AM"
    },
    {
      id: "bloodPressure",
      name: "Blood Pressure",
      value: "118/78",
      unit: "mmHg",
      status: "Normal",
      statusColor: "emerald",
      icon: "Heart",
      change: "Stable",
      targetRange: "< 120/80 mmHg",
      lastUpdated: "Today, 8:30 AM"
    },
    {
      id: "weight",
      name: "Weight",
      value: "72.5",
      unit: "kg",
      status: "On Track",
      statusColor: "blue",
      icon: "Scale",
      change: "-0.5 kg this month",
      targetRange: "70-74 kg",
      lastUpdated: "Yesterday"
    },
    {
      id: "bloodGlucose",
      name: "Blood Glucose",
      value: "94",
      unit: "mg/dL",
      status: "Fasting Normal",
      statusColor: "emerald",
      icon: "Droplet",
      change: "Optimal",
      targetRange: "70-99 mg/dL",
      lastUpdated: "Today, 7:15 AM"
    },
    {
      id: "oxygen",
      name: "Oxygen Saturation",
      value: "98",
      unit: "%",
      status: "Excellent",
      statusColor: "teal",
      icon: "Wind",
      change: "+1% vs avg",
      targetRange: "95-100%",
      lastUpdated: "Today, 8:30 AM"
    },
    {
      id: "temperature",
      name: "Body Temperature",
      value: "98.4",
      unit: "°F",
      status: "Normal",
      statusColor: "emerald",
      icon: "Thermometer",
      change: "Normal",
      targetRange: "97.8 - 99.1 °F",
      lastUpdated: "Today, 8:30 AM"
    }
  ]
};

export const chartTrendsData = {
  heartRate: {
    daily: [
      { time: "6 AM", value: 64 },
      { time: "9 AM", value: 72 },
      { time: "12 PM", value: 78 },
      { time: "3 PM", value: 74 },
      { time: "6 PM", value: 70 },
      { time: "9 PM", value: 66 }
    ],
    weekly: [
      { time: "Mon", value: 71 },
      { time: "Tue", value: 73 },
      { time: "Wed", value: 70 },
      { time: "Thu", value: 75 },
      { time: "Fri", value: 72 },
      { time: "Sat", value: 68 },
      { time: "Sun", value: 69 }
    ],
    monthly: [
      { time: "Week 1", value: 74 },
      { time: "Week 2", value: 72 },
      { time: "Week 3", value: 71 },
      { time: "Week 4", value: 72 }
    ]
  },
  bloodPressure: {
    daily: [
      { time: "6 AM", systolic: 116, diastolic: 76 },
      { time: "12 PM", systolic: 120, diastolic: 80 },
      { time: "6 PM", systolic: 118, diastolic: 78 }
    ],
    weekly: [
      { time: "Mon", systolic: 120, diastolic: 80 },
      { time: "Tue", systolic: 119, diastolic: 79 },
      { time: "Wed", systolic: 118, diastolic: 78 },
      { time: "Thu", systolic: 121, diastolic: 81 },
      { time: "Fri", systolic: 117, diastolic: 77 },
      { time: "Sat", systolic: 118, diastolic: 78 },
      { time: "Sun", systolic: 116, diastolic: 76 }
    ],
    monthly: [
      { time: "Week 1", systolic: 122, diastolic: 82 },
      { time: "Week 2", systolic: 120, diastolic: 80 },
      { time: "Week 3", systolic: 119, diastolic: 79 },
      { time: "Week 4", systolic: 118, diastolic: 78 }
    ]
  },
  bloodGlucose: {
    daily: [
      { time: "Fast", value: 92 },
      { time: "Post-B", value: 128 },
      { time: "Post-L", value: 135 },
      { time: "Post-D", value: 118 }
    ],
    weekly: [
      { time: "Mon", value: 94 },
      { time: "Tue", value: 96 },
      { time: "Wed", value: 91 },
      { time: "Thu", value: 95 },
      { time: "Fri", value: 93 },
      { time: "Sat", value: 98 },
      { time: "Sun", value: 92 }
    ],
    monthly: [
      { time: "Week 1", value: 98 },
      { time: "Week 2", value: 95 },
      { time: "Week 3", value: 94 },
      { time: "Week 4", value: 93 }
    ]
  },
  weight: {
    daily: [
      { time: "Mon", value: 73.0 },
      { time: "Wed", value: 72.8 },
      { time: "Fri", value: 72.6 },
      { time: "Sun", value: 72.5 }
    ],
    weekly: [
      { time: "Wk 1", value: 73.5 },
      { time: "Wk 2", value: 73.1 },
      { time: "Wk 3", value: 72.8 },
      { time: "Wk 4", value: 72.5 }
    ],
    monthly: [
      { time: "Jan", value: 74.5 },
      { time: "Feb", value: 73.8 },
      { time: "Mar", value: 73.2 },
      { time: "Apr", value: 72.5 }
    ]
  }
};

export const initialReminders = [
  {
    id: "rem_1",
    title: "Take Vitamin D3 (2000 IU)",
    time: "09:00 AM",
    date: "Today",
    category: "Medication",
    completed: false,
    repeat: "Daily",
    notes: "Take with breakfast for better absorption"
  },
  {
    id: "rem_2",
    title: "Blood Pressure Monitoring",
    time: "10:30 AM",
    date: "Today",
    category: "Checkup",
    completed: true,
    repeat: "Daily",
    notes: "Rest 5 mins before taking reading"
  },
  {
    id: "rem_3",
    title: "Hydration Check: 500ml Water",
    time: "02:00 PM",
    date: "Today",
    category: "Hydration",
    completed: false,
    repeat: "Hourly",
    notes: "Goal: 2.5L per day"
  },
  {
    id: "rem_4",
    title: "Evening Brisk Walk (30 mins)",
    time: "06:30 PM",
    date: "Today",
    category: "Exercise",
    completed: false,
    repeat: "Mon, Wed, Fri",
    notes: "Moderate pace outdoor walk"
  },
  {
    id: "rem_5",
    title: "Refill Asthma Inhaler Prescription",
    time: "11:00 AM",
    date: "Tomorrow",
    category: "Medication",
    completed: false,
    repeat: "Monthly",
    notes: "Visit local CVS pharmacy"
  },
  {
    id: "rem_6",
    title: "Annual Health Checkup Appointment",
    time: "09:30 AM",
    date: "2026-10-05",
    category: "Checkup",
    completed: false,
    repeat: "Once",
    notes: "Fasting required 8 hours prior"
  }
];

export const initialHealthRecords = [
  {
    id: "rec_1",
    title: "Comprehensive Metabolic Panel & Lipid Profile",
    category: "Lab Report",
    date: "2026-08-20",
    doctor: "Dr. Eleanor Vance, MD",
    facility: "City Central Diagnostics",
    description: "Fasting glucose, lipid panel, kidney and liver function tests. All markers within normal limits except slightly elevated HDL.",
    fileSize: "1.4 MB",
    fileType: "PDF"
  },
  {
    id: "rec_2",
    title: "Amoxicillin & Albuterol Prescription",
    category: "Prescription",
    date: "2026-07-14",
    doctor: "Dr. Marcus Brody",
    facility: "Springfield Health Clinic",
    description: "Prescription for seasonal allergic bronchitis. 7-day course completed successfully.",
    fileSize: "420 KB",
    fileType: "PDF"
  },
  {
    id: "rec_3",
    title: "Annual Chest X-Ray & Screening",
    category: "Medical Report",
    date: "2026-05-10",
    doctor: "Dr. Sarah Jenkins",
    facility: "St. Jude Memorial Hospital",
    description: "Clear lung fields, normal cardiac silhouette, no acute cardiopulmonary abnormalities detected.",
    fileSize: "3.2 MB",
    fileType: "PDF"
  },
  {
    id: "rec_4",
    title: "Influenza & COVID-19 Booster Vaccine",
    category: "Vaccination",
    date: "2025-11-02",
    doctor: "Pharmacy Nurse Specialist",
    facility: "Walgreens Health Hub",
    description: "Annual quadrivalent flu vaccine and updated mRNA booster administered in left deltoid.",
    fileSize: "280 KB",
    fileType: "PDF"
  }
];

export const initialMedications = [
  {
    id: "med_1",
    name: "Vitamin D3 (Cholecalciferol)",
    dosage: "2000 IU",
    frequency: "Once daily",
    timing: ["Morning"],
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    instructions: "Take with breakfast or fatty meal for optimal absorption.",
    status: "Active",
    prescribedBy: "Dr. Eleanor Vance",
    takenToday: true
  },
  {
    id: "med_2",
    name: "Albuterol Inhaler (Ventolin HFA)",
    dosage: "90 mcg/actuation",
    frequency: "As needed (PRN)",
    timing: ["As needed"],
    startDate: "2026-03-15",
    endDate: "Ongoing",
    instructions: "1 to 2 puffs prior to exercise or during asthma flare up.",
    status: "Active",
    prescribedBy: "Dr. Marcus Brody",
    takenToday: false
  },
  {
    id: "med_3",
    name: "Omega-3 Fish Oil",
    dosage: "1000 mg",
    frequency: "Twice daily",
    timing: ["Morning", "Evening"],
    startDate: "2026-02-01",
    endDate: "2026-12-31",
    instructions: "Take with meals and plenty of water.",
    status: "Active",
    prescribedBy: "Self-Supplement",
    takenToday: false
  },
  {
    id: "med_4",
    name: "Amoxicillin Trihydrate",
    dosage: "500 mg",
    frequency: "Three times daily",
    timing: ["Morning", "Afternoon", "Night"],
    startDate: "2026-07-14",
    endDate: "2026-07-21",
    instructions: "Completed 7-day antibiotic course for throat infection.",
    status: "Completed",
    prescribedBy: "Dr. Marcus Brody",
    takenToday: false
  }
];

export const initialAIChats = [
  {
    id: "chat_1",
    title: "Understanding Blood Pressure Readings",
    updatedAt: "Today, 10:15 AM",
    messages: [
      {
        sender: "user",
        text: "What does a blood pressure reading of 118/78 mmHg mean?",
        timestamp: "10:14 AM"
      },
      {
        sender: "ai",
        text: "A blood pressure reading of **118/78 mmHg** is considered **Normal and Healthy** according to American Heart Association guidelines.\n\nHere is a quick breakdown:\n- **Systolic (118 mmHg)**: The top number measures pressure in your arteries when your heart beats. Ideal range is under 120.\n- **Diastolic (78 mmHg)**: The bottom number measures pressure when your heart rests between beats. Ideal range is under 80.\n\nKeep up your healthy routine with regular physical activity and a balanced diet!",
        timestamp: "10:15 AM"
      }
    ]
  }
];

export const suggestedAIQuestions = [
  "What does my blood pressure reading mean?",
  "Explain my latest health record",
  "What vital signs should I track daily?",
  "Help me understand my medication schedule",
  "What are healthy fasting blood glucose targets?",
  "Tips for managing seasonal allergic symptoms"
];
