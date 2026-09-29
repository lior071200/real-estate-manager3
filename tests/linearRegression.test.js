// בדיקות יחידה (Unit Tests) למודול הרגרסיה הלינארית.
// מריצים עם: node --test tests/linearRegression.test.js
// (או node --test כדי להריץ את כל הבדיקות בתיקייה)

const test = require('node:test');
const assert = require('node:assert');
const { trainLinearRegression, predict } = require('../linearRegression');

test('trainLinearRegression learns exact coefficients on noiseless linear data', () => {
    // y = 3 + 2*x1 + 5*x2 בדיוק, בלי רעש - המודל אמור ללמוד את המקדמים 3, 2, 5 במדויק
    const X = [
        [1, 1, 1],
        [1, 2, 1],
        [1, 1, 2],
        [1, 3, 2],
        [1, 4, 3],
        [1, 2, 4]
    ];
    const y = X.map(row => 3 + 2 * row[1] + 5 * row[2]);

    const theta = trainLinearRegression(X, y);

    assert.ok(Math.abs(theta[0] - 3) < 0.001, `Expected bias ~3, got ${theta[0]}`);
    assert.ok(Math.abs(theta[1] - 2) < 0.001, `Expected w1 ~2, got ${theta[1]}`);
    assert.ok(Math.abs(theta[2] - 5) < 0.001, `Expected w2 ~5, got ${theta[2]}`);
});

test('predict computes correct dot product with learned coefficients', () => {
    const theta = [3, 2, 5]; // y = 3 + 2*x1 + 5*x2
    const result = predict(theta, [1, 5, 5]); // 3 + 10 + 25 = 38

    assert.strictEqual(result, 38);
});

test('trainLinearRegression works with single feature (simple linear regression)', () => {
    // y = 10 + 3*x
    const X = [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]];
    const y = X.map(row => 10 + 3 * row[1]);

    const theta = trainLinearRegression(X, y);

    assert.ok(Math.abs(theta[0] - 10) < 0.001);
    assert.ok(Math.abs(theta[1] - 3) < 0.001);
});

test('trainLinearRegression handles small amount of noise reasonably (approximate fit)', () => {
    // y = 5 + 2*x + noise קטן - המודל אמור להתקרב מאוד, לא בדיוק מושלם
    const X = [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5]];
    const noise = [0.1, -0.1, 0.05, -0.05, 0.1, -0.1];
    const y = X.map((row, i) => 5 + 2 * row[1] + noise[i]);

    const theta = trainLinearRegression(X, y);

    assert.ok(Math.abs(theta[0] - 5) < 0.5, `Expected bias close to 5, got ${theta[0]}`);
    assert.ok(Math.abs(theta[1] - 2) < 0.5, `Expected slope close to 2, got ${theta[1]}`);
});

test('invert throws a clear error on a singular (non-invertible) matrix', () => {
    // מטריצה שבה שורה היא כפולה של שורה אחרת - לא הפיכה
    const X = [
        [1, 1, 2],
        [1, 2, 4], // כפולה מדויקת של תבנית שגורמת לעמודות תלויות ליניארית
        [1, 3, 6]
    ];
    const y = [1, 2, 3];

    assert.throws(() => trainLinearRegression(X, y), /אינה הפיכה/);
});