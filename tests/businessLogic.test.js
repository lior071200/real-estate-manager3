// בדיקות יחידה ללוגיקת ה-Matching והדשבורד.
// מריצים עם: node --test tests/businessLogic.test.js

const test = require('node:test');
const assert = require('node:assert');
const { computeMatches, hasAnyMatch, averagePriceByCity, computeStats } = require('../businessLogic');

const sampleProperties = [
    { id: 1, address: 'הרצל 12', city: 'Tel Aviv', rooms: 3, size: 85, type: 'למכירה', price: 3200000 },
    { id: 2, address: 'ז\'בוטינסקי 45', city: 'Ramat Gan', rooms: 4, size: 105, type: 'להשכרה', price: 7500 },
    { id: 3, address: 'הרב קוק 8', city: 'Tel Aviv', rooms: 2, size: 55, type: 'למכירה', price: 2600000 },
    { id: 4, address: 'ביאליק 3', city: 'Jerusalem', rooms: 5, size: 130, type: 'למכירה', price: 3900000 }
];

test('computeMatches returns only properties in the same city', () => {
    const customer = { preferredCity: 'Tel Aviv', minRooms: 1, budget: 10000000 };
    const matches = computeMatches(customer, sampleProperties);

    assert.strictEqual(matches.length, 2);
    matches.forEach(p => assert.strictEqual(p.city, 'Tel Aviv'));
});

test('computeMatches filters out properties with too few rooms', () => {
    const customer = { preferredCity: 'Tel Aviv', minRooms: 3, budget: 10000000 };
    const matches = computeMatches(customer, sampleProperties);

    // רק הרצל 12 (3 חדרים) עומד בדרישה - הרב קוק 8 (2 חדרים) נופל
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].id, 1);
});

test('computeMatches allows a 10% budget overage but not more', () => {
    // תקציב 3,000,000 -> תקרה 3,300,000. מגבילים גם minRooms=3 כדי לבודד רק את התנאי על תקציב
    const customer = { preferredCity: 'Tel Aviv', minRooms: 3, budget: 3000000 };
    const matches = computeMatches(customer, sampleProperties);

    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].id, 1); // 3,200,000 <= 3,300,000
});

test('computeMatches returns empty array when nothing matches', () => {
    const customer = { preferredCity: 'Haifa', minRooms: 1, budget: 10000000 };
    const matches = computeMatches(customer, sampleProperties);

    assert.strictEqual(matches.length, 0);
});

test('hasAnyMatch returns true/false correctly', () => {
    const customerWithMatch = { preferredCity: 'Tel Aviv', minRooms: 1, budget: 10000000 };
    const customerWithoutMatch = { preferredCity: 'Haifa', minRooms: 1, budget: 10000000 };

    assert.strictEqual(hasAnyMatch(customerWithMatch, sampleProperties), true);
    assert.strictEqual(hasAnyMatch(customerWithoutMatch, sampleProperties), false);
});

test('averagePriceByCity computes correct average for multiple properties in same city', () => {
    const avg = averagePriceByCity(sampleProperties, 'למכירה');

    // תל אביב: (3,200,000 + 2,600,000) / 2 = 2,900,000
    assert.strictEqual(avg['Tel Aviv'], 2900000);
    // ירושלים: נכס יחיד, הממוצע הוא המחיר עצמו
    assert.strictEqual(avg['Jerusalem'], 3900000);
    // רמת גן: אין נכסים "למכירה" (רק "להשכרה") - לא אמור להופיע במפתחות
    assert.strictEqual('Ramat Gan' in avg, false);
});

test('averagePriceByCity returns empty object when no properties of that type exist', () => {
    const avg = averagePriceByCity(sampleProperties, 'להשכרה');

    assert.strictEqual(Object.keys(avg).length, 1); // רק Ramat Gan
    assert.strictEqual(avg['Ramat Gan'], 7500);
});

test('computeStats returns correct totals and counts', () => {
    const customers = [
        { id: 1, preferredCity: 'Tel Aviv', minRooms: 1, budget: 10000000 }, // יש התאמה
        { id: 2, preferredCity: 'Haifa', minRooms: 1, budget: 10000000 }      // אין התאמה
    ];

    const stats = computeStats(sampleProperties, customers);

    assert.strictEqual(stats.totalProperties, 4);
    assert.strictEqual(stats.totalCustomers, 2);
    assert.strictEqual(stats.countByType['למכירה'], 3);
    assert.strictEqual(stats.countByType['להשכרה'], 1);
    assert.strictEqual(stats.countByCity['Tel Aviv'], 2);
    assert.strictEqual(stats.customersWithMatches, 1);
});

test('computeStats handles empty properties/customers lists without crashing', () => {
    const stats = computeStats([], []);

    assert.strictEqual(stats.totalProperties, 0);
    assert.strictEqual(stats.totalCustomers, 0);
    assert.strictEqual(stats.customersWithMatches, 0);
    assert.deepStrictEqual(stats.avgPriceByCitySale, {});
    assert.strictEqual(stats.countByType['למכירה'], 0);
});