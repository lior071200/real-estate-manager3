# 🏢 מערכת מתקדמת לניהול נדל"ן | Real Estate Management System 🏠

| 📋 פרטי סטודנט / הגשה | 
| ----- | 
| **שם מלא:** \[הכניסי את שמך כאן\] | 
| **תעודת זהות:** \[הכניסי ת.ז. כאן\] | 
| **מוסד לימודים:** \[שם מכללה / אוניברסיטה\] | 
| **שם המרצה / מנחה:** \[שם המרצה\] | 
| **קורס / פרויקט:** פרויקט גמר בפיתוח Full-Stack | 
| **תאריך הגשה:** נובמבר 2026 | 

## 📖 סיפור הפרויקט והתפתחותו

הפרויקט **Real Estate Management System** החל כמערכת ניהול ובסיס נתונים לנדל"ן, ועם הזמן שודרג והתרחב בהתאם לדרישות הפיתוח והנחיות המרצה.

בשלבים המתקדמים (אוקטובר 2026), התווספו למערכת רכיבי אלגוריתמיקה מתקדמים, שירותי סטטיסטיקה, מודלי רגרסיה ליניארית לחיזוי מגמות מחיר, ומערכות ניהול קריאות שירות ותקשורת.

## 🚀 טכנולוגיות מרכזיות (Tech Stack)

* 💻 **Frontend:** React.js, HTML5, CSS3, JavaScript (ES6+)

* ⚙️ **Backend:** Node.js, Express.js

* 🗄️ **Database & Data Handling:** MongoDB, XLSX (עיבוד קבצי אקסל), JSON DB

* 🖼️ **Media & Files:** Multer להעלאת תמונות וקבצי נכסים

* 🧪 **Testing & Tools:** Postman, Git & GitHub

## 🛠️ מבנה הקוד ודוגמאות מודולים מרכזיים

### 1. 🧠 לוגיקה עסקית וניתוח נתונים (`businessLogic.js`)

מנהל את החישובים העסקיים המורכבים, סינון נכסים לפי פרמטרים מרובים והפקת דוחות.

```
// businessLogic.js - דוגמה לניתוח נתוני נכסים
const calculatePropertyStats = (properties) => {
  if (!properties || properties.length === 0) return null;
  
  const totalValue = properties.reduce((sum, item) => sum + item.price, 0);
  const avgPrice = totalValue / properties.length;
  
  return {
    totalProperties: properties.length,
    averagePrice: avgPrice,
    maxPrice: Math.max(...properties.map(p => p.price)),
    minPrice: Math.min(...properties.map(p => p.price))
  };
};

```

### 2. 📈 מודל חיזוי ורגרסיה ליניארית (`linearRegression.js`)

משמש לחיזוי מחירי נכסים ומגמות שוק בהתבסס על מודל מתמטי.

```
// linearRegression.js - אלגוריתם חיזוי מחירי נדל"ן
function calculateLinearRegression(xArray, yArray) {
  const n = xArray.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += xArray[i];
    sumY += yArray[i];
    sumXY += (xArray[i] * yArray[i]);
    sumXX += (xArray[i] * xArray[i]);
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

```

### 3. 🏗️ שירות ניהול נכסים (`propertiesservice.js`)

ניהול שליפת נכסים לפי ערים (ירושלים, תל אביב, באר שבע, חיפה ועוד) וטפול בנכסים מיוחדים.

```
// propertiesservice.js - ניהול שליפת נכסים לפי עיר
const getPropertiesByCity = async (city) => {
  try {
    const properties = await Property.find({ city: city });
    return properties;
  } catch (error) {
    console.error("Error fetching properties by city:", error);
    throw error;
  }
};

```

### 4. 🌐 שרת REST API ראשי (`server.js`)

נקודת הכניסה הראשית של השרת, הגדרת הנתיבים והתקשרות עם צד הלקוח.

```
// server.js - הגדרת שרת ה-Express והנתיבים
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/properties', require('./routes/properties'));
app.use('/api/tickets', require('./routes/tickets'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

```

## 📂 מבנה התיקיות בפרויקט

```
real-estate-manager3/
│
├── 📁 מודולים/             # סכמות ומודלים של מסד הנתונים
├── 📁 מסלולים/             # נתובי API (Routes)
├── 📁 תוכנה ביניים/        # Middleware לאימות וטיפול בבקשות
├── 📁 בדיקות/              # בדיקות איכות ואינטגרציה
├── 📁 העלאות/              # תיקיית אחסון תמונות וקבצים
│
├── 📄 server.js             # שרת REST API מרכזי
├── 📄 businessLogic.js      # לוגיקה עסקית וניתוחים
├── 📄 linearRegression.js   # אלגוריתם חיזוי מתמטי
├── 📄 propertiesservice.js  # שירותי נכסים וחיפוש
├── 📄 שירות סטטיסטיקות.js   # חישוב דוחות ואנליטיקות
├── 📄 שירות כרטיסים.js     # ניהול קריאות שירות ותקלות
└── 📄 README.md             # תיעוד הפרויקט

```

## 📋 הוראות הרצה מקומית

1. **שיכפול הריפוזיטורי:**

   ```
   git clone https://github.com/lior071200/real-estate-manager3.git
   cd real-estate-manager3
   
   ```

2. **התקנת תלויות:**

   ```
   npm install
   
   ```

3. **הרצת השרת:**

   ```
   npm start
   
   ```

## 📌 הערות סיכום להגשה

המערכת נבדקה בצורה מקיפה דרך Postman, כוללת טיפול בשגיאות, ניהול קבצים אסינכרוני, ומבנה קוד נקי ומודולרי המוכן להצגה.