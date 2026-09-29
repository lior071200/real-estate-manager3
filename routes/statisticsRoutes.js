const express = require('express');
const router = express.Router();
const path = require('path');
const xlsx = require('xlsx');

// GET /api/properties-search/search
router.get('/search', (req, res) => {
  try {
    // התחברות לקובץ ה-Excel בתיקיית data הראשית
    const filePath = path.join(__dirname, '..', '..', 'data', 'real_estate.xlsx');

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const properties = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const filters = req.query;

    // סינון הנתונים לפי מה שהמשתמש ביקש ב-Postman / בדפדפן
    const filteredResults = properties.filter(item => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.minPrice && Number(item.price) < Number(filters.minPrice)) return false;
      if (filters.maxPrice && Number(item.price) > Number(filters.maxPrice)) return false;
      if (filters.rooms && Number(item.rooms) !== Number(filters.rooms)) return false;
      if (filters.city && !item.city?.toString().includes(filters.city)) return false;
      return true;
    });

    res.status(200).json({
      success: true,
      count: filteredResults.length,
      data: filteredResults
    });
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ success: false, message: 'שגיאה בביצוע החיפוש בנתונים' });
  }
});

module.exports = router;