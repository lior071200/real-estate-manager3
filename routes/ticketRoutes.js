const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// נניח שיש middleware המאמת טוקן (JWT) ומחלץ את נתוני המשתמש ל-req.user
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/tickets
 * @desc    יצירת קריאת תקלה חדשה (עבור דיירים)
 * @access  Private (Tenant)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId, title, description, images } = req.body;

    const ticket = await Ticket.create({
      tenant: req.user._id, // נתון מאומת שהגיע מה-Token
      property: propertyId,
      title,
      description,
      images: images || [],
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tickets
 * @desc    שליפת קריאות: דייר רואה רק את של עצמו, מנהל רואה את כולן
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // סינון לפי תפקיד: אם המשתמש הוא דייר, החזר רק את הקריאות שלו
    if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    }

    // אפשרות לסינון לפי סטטוס דרך query param (למשל: GET /api/tickets?status=Open)
    if (req.query.status) {
      query.status = req.query.status;
    }

    const tickets = await Ticket.find(query)
      .populate('tenant', 'name email phone') // שליפת פרטי דייר בסיסיים בלבד
      .populate('property', 'address unitNumber') // שליפת פרטי נכס בסיסיים
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PATCH /api/tickets/:id
 * @desc    עדכון סטטוס/הערות (מנהל בלבד)
 * @access  Private (Admin / Manager)
 */
router.patch('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status, priority, managerNotes } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status, priority, managerNotes },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'הקריאה לא נמצאה' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;