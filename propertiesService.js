const xlsx = require('xlsx');

/**
 * פונקציה לקריאת הנתונים מה-Excel וסינון שלהם לפי פרמטרים
 */
function searchProperties(filePath, filters) {
  // קריאת קובץ ה-Excel והמרת הגיליון ל-JSON
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const properties = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // סינון המערך לפי ה-Query Params שהתקבלו
  return properties.filter(item => {
    // סינון לפי סוג נכס (מכירה / השכרה)
    if (filters.type && item.type !== filters.type) {
      return false;
    }

    // סינון לפי מחיר מינימלי
    if (filters.minPrice && Number(item.price) < Number(filters.minPrice)) {
      return false;
    }

    // סינון לפי מחיר מקסימלי
    if (filters.maxPrice && Number(item.price) > Number(filters.maxPrice)) {
      return false;
    }

    // סינון לפי מספר חדרים מדויק או מינימלי
    if (filters.rooms && Number(item.rooms) !== Number(filters.rooms)) {
      return false;
    }

    // סינון לפי עיר / מיקום (חיפוש חלק ממילה)
    if (filters.city && !item.city?.toString().includes(filters.city)) {
      return false;
    }

    return true;
  });
}

module.exports = { searchProperties };