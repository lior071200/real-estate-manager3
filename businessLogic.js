// מודול לוגיקה עסקית "טהורה" - בלי שום תלות ב-Express או בקבצים.
// הופרד בכוונה מ-server.js כדי שאפשר יהיה לבדוק אותו בבדיקות יחידה (unit tests)
// בלי צורך להריץ שרת אמיתי.

const CITIES = [
    'Tel Aviv',
    'Jerusalem',
    'Haifa',
    'Ramat Gan',
    'Ashdod',
    'Rishon LeZion',
    'Petah Tikva',
    'Beer Sheva',
    'Netanya'
];

// הופך רשומת נכס לוקטור פיצ'רים למודל הרגרסיה:
// [bias, rooms, size, isJerusalem, isHaifa, isRamatGan, isAshdod, isRishonLeZion, isPetahTikva, isBeerSheva, isNetanya]
// תל אביב היא עיר הבסיס (baseline) ולכן אין לה משתנה דמה נפרד.
function extractFeatures({ rooms, size, city }) {
    return [
        1, // משתנה הבסיס (bias)
        Number(rooms),
        Number(size),
        city === 'Jerusalem' ? 1 : 0,
        city === 'Haifa' ? 1 : 0,
        city === 'Ramat Gan' ? 1 : 0,
        city === 'Ashdod' ? 1 : 0,
        city === 'Rishon LeZion' ? 1 : 0,
        city === 'Petah Tikva' ? 1 : 0,
        city === 'Beer Sheva' ? 1 : 0,
        city === 'Netanya' ? 1 : 0
    ];
}

// מחזיר את הנכסים המתאימים ללקוח: אותה עיר, מספיק חדרים, ובתוך התקציב (עד 10% חריגה)
function computeMatches(customer, properties) {
    const budgetCeiling = customer.budget * 1.1;

    return properties.filter(p =>
        p.city === customer.preferredCity &&
        p.rooms >= customer.minRooms &&
        p.price <= budgetCeiling
    );
}

// בודק האם ללקוח נתון יש לפחות התאמה זמינה אחת
function hasAnyMatch(customer, properties) {
    return computeMatches(customer, properties).length > 0;
}

// מחשב ממוצע מחיר לפי עיר, לסוג נכס נתון (למכירה / להשכרה)
function averagePriceByCity(properties, type) {
    const rows = properties.filter(p => p.type === type);
    const byCity = {};

    CITIES.forEach(city => {
        const cityRows = rows.filter(p => p.city === city);
        if (cityRows.length > 0) {
            const sum = cityRows.reduce((acc, p) => acc + p.price, 0);
            byCity[city] = Math.round(sum / cityRows.length);
        }
    });

    return byCity;
}

// מחשב את כל נתוני הדשבורד בבת אחת
function computeStats(properties, customers) {
    const countByCity = {};
    CITIES.forEach(city => {
        countByCity[city] = properties.filter(p => p.city === city).length;
    });

    const countByType = {
        'למכירה': properties.filter(p => p.type === 'למכירה').length,
        'להשכרה': properties.filter(p => p.type === 'להשכרה').length
    };

    const customersWithMatches = customers.filter(c => hasAnyMatch(c, properties)).length;

    return {
        totalProperties: properties.length,
        totalCustomers: customers.length,
        avgPriceByCitySale: averagePriceByCity(properties, 'למכירה'),
        avgPriceByCityRent: averagePriceByCity(properties, 'להשכרה'),
        countByCity,
        countByType,
        customersWithMatches
    };
}

module.exports = {
    CITIES,
    extractFeatures,
    computeMatches,
    hasAnyMatch,
    averagePriceByCity,
    computeStats
};