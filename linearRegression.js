// מודול רגרסיה לינארית מרובת-משתנים (Multiple Linear Regression)
// נכתב מאפס ב-JavaScript טהור, ללא ספריות ML חיצוניות, כדי שיהיה קל
// להריץ (npm install רגיל בלבד) וקל להסביר בהגנת פרויקט.
//
// שיטה: פתרון משוואות נורמליות (Normal Equations) בעזרת אלימינציית גאוס-ג'ורדן.
// theta = (X^T * X)^-1 * X^T * y

function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

function multiply(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        result.push([]);
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < b.length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i].push(sum);
        }
    }
    return result;
}

// היפוך מטריצה ריבועית באמצעות אלימינציית גאוס-ג'ורדן
function invert(matrix) {
    const n = matrix.length;
    const identity = matrix.map((row, i) =>
        row.map((_, j) => (i === j ? 1 : 0))
    );

    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

    for (let col = 0; col < n; col++) {
        // מציאת שורת ציר (pivot) עם הערך המוחלט הגדול ביותר, למען יציבות נומרית
        let pivotRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
                pivotRow = row;
            }
        }
        [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];

        const pivot = augmented[col][col];
        if (Math.abs(pivot) < 1e-10) {
            throw new Error('המטריצה אינה הפיכה - ייתכן וחסר מגוון מספיק בדאטה');
        }

        for (let j = 0; j < 2 * n; j++) {
            augmented[col][j] /= pivot;
        }

        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = augmented[row][col];
            for (let j = 0; j < 2 * n; j++) {
                augmented[row][j] -= factor * augmented[col][j];
            }
        }
    }

    return augmented.map(row => row.slice(n));
}

/**
 * מאמן מודל רגרסיה לינארית.
 * @param {number[][]} X - מטריצת פיצ'רים, כל שורה היא דוגמה, כולל עמודת bias (1) ראשונה
 * @param {number[]} y - וקטור התוצאות (המחירים)
 * @returns {number[]} theta - וקטור המקדמים שנלמדו
 */
function trainLinearRegression(X, y) {
    const Xt = transpose(X);
    const XtX = multiply(Xt, X);
    const XtXInv = invert(XtX);
    const yMatrix = y.map(val => [val]);
    const XtY = multiply(Xt, yMatrix);
    const theta = multiply(XtXInv, XtY);
    return theta.map(row => row[0]);
}

function predict(theta, featureRow) {
    return featureRow.reduce((sum, val, i) => sum + val * theta[i], 0);
}

module.exports = { trainLinearRegression, predict };
