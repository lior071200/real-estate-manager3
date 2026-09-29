const express = require('express');
const router = express.Router();
const path = require('path');
const xlsx = require('xlsx');
const multer = require('multer');
const fs = require('fs');

// זיכרון זמני בשרת לשיוך תמונות ולפניות לקוחות
const propertyImages = {}; // { propertyId/Index: imageUrl }
const inquiries = [];      // רשימת פניות מלקוחות

// יצירת תיקיית uploads במידה ואינה קיימת
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת Multer לשמירת תמונות
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'property-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// 1. GET /api/properties-search/search - חיפוש וסינון נכסים (כולל תמונות!)
router.get('/search', (req, res) => {
  try {
    const filePath = path.join(process.cwd(), '..', 'data', 'real_estate.xlsx.xlsx');

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawProperties = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const filters = req.query;

    const filteredResults = rawProperties
      .map((item, index) => {
        const id = index + 1;
        const city = item.city || item['עמודה A (עיר)'] || item['עיר'];
        const type = item.type || item['עמודה B (סוג עסקה)'] || item['סוג עסקה'];
        const price = item.price || item['עמודה C (מחיר)'] || item['מחיר'];
        const rooms = item.rooms || item['חדרים'];
        const size = item.size || item['עמודה D (גודל במ"ר)'] || item['גודל במ"ר'];

        // תמונה ששויכה לנכס או תמונת ברירת מחדל
        const imageUrl = propertyImages[id] || `${req.protocol}://${req.get('host')}/uploads/default-property.jpg`;

        return {
          id,
          city,
          type,
          price: Number(price),
          rooms: rooms ? Number(rooms) : undefined,
          size: size ? Number(size) : undefined,
          imageUrl
        };
      })
      .filter(item => {
        if (filters.type && item.type !== filters.type) return false;
        if (filters.minPrice && item.price < Number(filters.minPrice)) return false;
        if (filters.maxPrice && item.price > Number(filters.maxPrice)) return false;
        if (filters.rooms && item.rooms !== Number(filters.rooms)) return false;
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
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בביצוע החיפוש',
      errorDetails: error.message 
    });
  }
});

// 2. POST /api/properties-search/upload-image - העלאת תמונת נכס
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'לא נבחרה תמונה להעלאה' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'התמונה הועלתה בהצלחה',
      data: {
        filename: req.file.filename,
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהעלאת התמונה' });
  }
});

// 3. POST /api/properties-search/assign-image - שיוך תמונה שנשמרה לנכס ספציפי
router.post('/assign-image', (req, res) => {
  try {
    const { propertyId, imageUrl } = req.body;

    if (!propertyId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'חובה לספק propertyId ו-imageUrl'
      });
    }

    propertyImages[propertyId] = imageUrl;

    res.status(200).json({
      success: true,
      message: `התמונה שויכה בהצלחה לנכס מספר ${propertyId}`,
      data: { propertyId, imageUrl }
    });
  } catch (error) {
    console.error('Error assigning image:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשיוך התמונה לנכס' });
  }
});

// 4. POST /api/properties-search/contact - טופס יצירת קשר ופנייה לסוכן
router.post('/contact', (req, res) => {
  try {
    const { propertyId, fullName, phone, email, message } = req.body;

    if (!fullName || !phone || !propertyId) {
      return res.status(400).json({
        success: false,
        message: 'חובה לספק: propertyId, fullName, phone'
      });
    }

    const newInquiry = {
      id: inquiries.length + 1,
      propertyId: Number(propertyId),
      fullName,
      phone,
      email: email || 'לא צוין',
      message: message || '',
      createdAt: new Date().toISOString()
    };

    inquiries.push(newInquiry);

    res.status(201).json({
      success: true,
      message: 'הפנייה נשמרה בהצלחה! סוכן נדל"ן יצור עמך קשר בהקדם.',
      data: newInquiry
    });
  } catch (error) {
    console.error('Error saving contact inquiry:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשמירת הפנייה' });
  }
});

// 5. GET /api/properties-search/inquiries - צפייה בפניות (לשימוש הסוכן / אדמין)
router.get('/inquiries', (req, res) => {
  res.status(200).json({
    success: true,
    count: inquiries.length,
    data: inquiries
  });
});

// 6. GET /api/properties-search/stats - דוח אנליטיקות
router.get('/stats', (req, res) => {
  try {
    const filePath = path.join(process.cwd(), '..', 'data', 'real_estate.xlsx.xlsx');

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const properties = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!properties || properties.length === 0) {
      return res.status(200).json({ success: true, message: 'אין נכסים במערכת' });
    }

    let totalPrice = 0;
    const dealTypes = {};
    const cities = {};
    let highestPriceProperty = null;
    let lowestPriceProperty = null;

    properties.forEach(item => {
      const city = item.city || item['עמודה A (עיר)'] || item['עיר'] || 'לא צוין';
      const type = item.type || item['עמודה B (סוג עסקה)'] || item['סוג עסקה'] || 'לא צוין';
      const price = Number(item.price || item['עמודה C (מחיר)'] || item['מחיר']) || 0;
      const size = Number(item.size || item['עמודה D (גודל במ"ר)'] || item['גודל במ"ר']) || 0;

      totalPrice += price;
      dealTypes[type] = (dealTypes[type] || 0) + 1;

      if (!cities[city]) {
        cities[city] = { count: 0, totalPrice: 0 };
      }
      cities[city].count += 1;
      cities[city].totalPrice += price;

      if (!highestPriceProperty || price > highestPriceProperty.price) {
        highestPriceProperty = { city, type, price, size };
      }
      if (!lowestPriceProperty || price < lowestPriceProperty.price) {
        lowestPriceProperty = { city, type, price, size };
      }
    });

    const cityStats = {};
    Object.keys(cities).forEach(cityName => {
      cityStats[cityName] = {
        totalProperties: cities[cityName].count,
        avgPrice: Math.round(cities[cityName].totalPrice / cities[cityName].count)
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProperties: properties.length,
        averagePrice: Math.round(totalPrice / properties.length),
        dealTypesDistribution: dealTypes,
        highestPriceProperty,
        lowestPriceProperty,
        cityStats
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בחישוב הסטטיסטיקות',
      errorDetails: error.message 
    });
  }
});

// 7. POST /api/properties-search/mortgage-calculator - מחשבון משכנתא
router.post('/mortgage-calculator', (req, res) => {
  try {
    const { propertyPrice, downPayment, interestRate, loanTermYears } = req.body;

    if (!propertyPrice || downPayment === undefined || !interestRate || !loanTermYears) {
      return res.status(400).json({
        success: false,
        message: 'חובה לספק: propertyPrice, downPayment, interestRate, loanTermYears'
      });
    }

    const price = Number(propertyPrice);
    const down = Number(downPayment);
    const annualRate = Number(interestRate);
    const years = Number(loanTermYears);

    if (down >= price) {
      return res.status(400).json({
        success: false,
        message: 'ההון העצמי אינו יכול להיות שווה או גדול ממחיר הנכס'
      });
    }

    const loanAmount = price - down;
    const financingPercentage = Math.round((loanAmount / price) * 100);
    const monthlyRate = (annualRate / 100) / 12;
    const totalPayments = years * 12;

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / totalPayments;
    } else {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    const totalRepayment = monthlyPayment * totalPayments;
    const totalInterest = totalRepayment - loanAmount;

    res.status(200).json({
      success: true,
      data: {
        propertyPrice: price,
        downPayment: down,
        loanAmount: loanAmount,
        financingPercentage: `${financingPercentage}%`,
        loanTermYears: years,
        annualInterestRate: `${annualRate}%`,
        monthlyPayment: Math.round(monthlyPayment),
        totalInterestPaid: Math.round(totalInterest),
        totalAmountPaid: Math.round(totalRepayment)
      }
    });
  } catch (error) {
    console.error('Error calculating mortgage:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בחישוב המשכנתא'
    });
  }
});

module.exports = router;