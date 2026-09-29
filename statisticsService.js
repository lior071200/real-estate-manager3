const ExcelJS = require('exceljs');
const fs = require('fs');

async function analyzeRealEstateData(filePath) {
  try {
    // 1. בדיקה שהקובץ קיים פיזית בשרת
    if (!fs.existsSync(filePath)) {
      throw new Error(`קובץ ה-Excel לא נמצא בנתיב: ${filePath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // 2. בדיקה שקיים גיליון בקובץ
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('לא נמצא גיליון עבודה תקין בקובץ');
    }

    const citiesData = {};

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // דילוג על שורת כותרות

      // 3. ניקוי וטיפול בערכים ריקים/חלקים
      const cell1 = row.getCell(1).value;
      const cell2 = row.getCell(2).value;

      if (!cell1 || !cell2) return; // דילוג על שורות ריקות בטעות

      const city = String(cell1).trim();
      const type = String(cell2).trim();
      const price = Number(row.getCell(3).value) || 0;
      const size = Number(row.getCell(4).value) || 0;

      // אתחול אובייקט עיר
      if (!citiesData[city]) {
        citiesData[city] = {
          salesTotal: 0, salesCount: 0,
          rentTotal: 0, rentCount: 0,
          sizes: [],
          totalPricePerSqm: 0, validSqmCount: 0
        };
      }

      // תמיכה בערכים גם בעברית וגם באנגלית
      if (type === 'מכירה' || type === 'sale') {
        citiesData[city].salesTotal += price;
        citiesData[city].salesCount += 1;

        if (size > 0 && price > 0) {
          citiesData[city].totalPricePerSqm += (price / size);
          citiesData[city].validSqmCount += 1;
        }
      } else if (type === 'השכרה' || type === 'rent') {
        citiesData[city].rentTotal += price;
        citiesData[city].rentCount += 1;
      }

      if (size > 0) {
        citiesData[city].sizes.push(size);
      }
    });

    // בדיקה אם הקובץ היה ריק מנתונים
    if (Object.keys(citiesData).length === 0) {
      return {
        citiesStatistics: [],
        mostCostEffectiveCity: { name: null, avgPricePerSqm: null }
      };
    }

    const finalStats = [];
    let bestValueCity = { name: null, avgPricePerSqm: null };
    let minAvgPrice = Infinity;

    for (const [city, data] of Object.entries(citiesData)) {
      const avgSalePrice = data.salesCount > 0 ? Math.round(data.salesTotal / data.salesCount) : 0;
      const avgRentPrice = data.rentCount > 0 ? Math.round(data.rentTotal / data.rentCount) : 0;

      const minSize = data.sizes.length > 0 ? Math.min(...data.sizes) : 0;
      const maxSize = data.sizes.length > 0 ? Math.max(...data.sizes) : 0;

      const avgPricePerSqm = data.validSqmCount > 0 ? (data.totalPricePerSqm / data.validSqmCount) : 0;

      if (avgPricePerSqm > 0 && avgPricePerSqm < minAvgPrice) {
        minAvgPrice = avgPricePerSqm;
        bestValueCity = { name: city, avgPricePerSqm: Math.round(avgPricePerSqm) };
      }

      finalStats.push({
        city,
        averageSalePrice: avgSalePrice,
        averageRentPrice: avgRentPrice,
        sizeRange: minSize === 0 && maxSize === 0 ? "לא צוין" : `${minSize} - ${maxSize} מ"ר`
      });
    }

    return {
      citiesStatistics: finalStats,
      mostCostEffectiveCity: bestValueCity
    };

  } catch (error) {
    console.error('Error reading Excel:', error.message);
    throw error; // העברת השגיאה ל-Controller
  }
}

module.exports = { analyzeRealEstateData };