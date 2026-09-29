const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    // קישור לדייר שפתח את הקריאה
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // קישור לנכס הרלוונטי
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'נא להזין כותרת לתקלה'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'נא להזין תיאור לתקלה'],
    },
    images: [{ type: String }], // מערך כתובות תמונה (Cloudinary וכו')
    category: {
      type: String,
      enum: ['Plumbing', 'Electrical', 'HVAC', 'General'],
      default: 'General',
    },
    status: {
      type: String,
      enum: ['Open', 'In_Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    managerNotes: {
      type: String,
    },
  },
  { timestamps: true } // מוסיף אוטומטית createdAt ו-updatedAt
);

// --- השכבה החכמה: Pre-Save Middleware ---
ticketSchema.pre('save', function (next) {
  // מורץ רק בעת יצירת קריאה חדשה
  if (this.isNew) {
    const fullText = `${this.title} ${this.description}`.toLowerCase();

    // בדיקת דחיפות חריגה
    const urgentKeywords = ['הצפה', 'פיצוץ', 'שרוף', 'קצר', 'דליפה חמורה', 'flood', 'fire'];
    if (urgentKeywords.some((keyword) => fullText.includes(keyword))) {
      this.priority = 'Urgent';
    }

    // סיווג קטגוריה אוטומטי
    if (/ברז|מים|ביוב|נזילה|צינור|כיור/.test(fullText)) {
      this.category = 'Plumbing';
    } else if (/חשמל|שקע|ארון חשמל|קצר|תאורה/.test(fullText)) {
      this.category = 'Electrical';
    } else if (/מזגן|חימום|קירור|שלט/.test(fullText)) {
      this.category = 'HVAC';
    }
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);