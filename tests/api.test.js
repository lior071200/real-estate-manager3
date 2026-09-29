// בדיקות אינטגרציה (Integration Tests) - מריצות את השרת האמיתי כתהליך נפרד
// ובודקות אותו דרך בקשות HTTP אמיתיות (fetch), בדיוק כמו שהפרונט-אנד עושה.
//
// מריצים עם: node --test tests/api.test.js
// (חשוב: זה שונה מבדיקות היחידה - כאן השרת האמיתי עולה, כולל קריאה/כתיבה
// לקבצי הדאטה האמיתיים ב-data/, אז מומלץ להריץ את זה בסביבת פיתוח ולא בפרודקשן)

const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const TEST_PORT = 5099; // פורט נפרד מהפורט הרגיל (5000), כדי לא להתנגש עם שרת שכבר רץ
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let serverProcess;

// מעלה את השרת כתהליך נפרד לפני כל הבדיקות, וממתין שהוא באמת מוכן לקבל בקשות
function startServer() {
    return new Promise((resolve, reject) => {
        serverProcess = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, PORT: TEST_PORT },
            stdio: 'pipe'
        });

        const timeout = setTimeout(() => reject(new Error('השרת לא עלה תוך 10 שניות')), 10000);

        serverProcess.stdout.on('data', (data) => {
            if (data.toString().includes('Server running on port')) {
                clearTimeout(timeout);
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('Server stderr:', data.toString());
        });

        serverProcess.on('error', reject);
    });
}

function stopServer() {
    if (serverProcess) {
        serverProcess.kill();
    }
}

test.before(async () => {
    await startServer();
});

test.after(() => {
    stopServer();
});

// ================== בדיקות אימות (Authentication) ==================

test('POST /login succeeds with correct admin credentials and returns a token', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.success, true);
    assert.ok(json.token, 'Expected a token in the response');
    assert.strictEqual(json.user.role, 'admin');
});

test('POST /login fails with wrong password', async () => {
    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    const json = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(json.success, false);
});

test('GET /properties without a token returns 401', async () => {
    const res = await fetch(`${BASE_URL}/properties`);
    assert.strictEqual(res.status, 401);
});

test('GET /properties with a valid token returns the property list', async () => {
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    const res = await fetch(`${BASE_URL}/properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(json.data));
});

test('viewer role cannot create a property (403 Forbidden)', async () => {
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'viewer', password: 'viewer123' })
    });
    const { token } = await loginRes.json();

    const res = await fetch(`${BASE_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            address: 'test street', city: 'Tel Aviv', rooms: 2, size: 50,
            type: 'למכירה', price: 1000000, agent: 'test agent'
        })
    });

    assert.strictEqual(res.status, 403);
});

// ================== בדיקות CRUD לנכסים (מלוות ניקוי אחרי עצמן) ==================

test('admin can create, update, and delete a property end-to-end', async () => {
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // יצירה
    const createRes = await fetch(`${BASE_URL}/properties`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            address: 'רחוב הבדיקה 1', city: 'Haifa', rooms: 3, size: 70,
            type: 'למכירה', price: 1500000, agent: 'בודק אוטומטי'
        })
    });
    const created = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    const newId = created.data.id;

    // עדכון
    const updateRes = await fetch(`${BASE_URL}/properties/${newId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ price: 1600000 })
    });
    const updated = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updated.data.price, 1600000);

    // מחיקה (ניקוי - חשוב כדי לא להשאיר נתוני בדיקה בקובץ האמיתי)
    const deleteRes = await fetch(`${BASE_URL}/properties/${newId}`, {
        method: 'DELETE',
        headers: authHeaders
    });
    assert.strictEqual(deleteRes.status, 200);

    // ודאי שהוא באמת נמחק
    const getRes = await fetch(`${BASE_URL}/properties/${newId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(getRes.status, 404);
});

// ================== בדיקות AI ומודל החיזוי ==================

test('POST /predict returns a numeric price prediction for a sale property', async () => {
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    const res = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rooms: 4, size: 100, city: 'Tel Aviv', type: 'למכירה' })
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof json.prediction, 'number');
    assert.ok(json.prediction > 0, 'Expected a positive predicted price');
});

test('POST /predict rejects an unsupported city', async () => {
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    const res = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rooms: 3, size: 80, city: 'New York', type: 'למכירה' })
    });

    assert.strictEqual(res.status, 400);
});

// ================== בדיקת דשבורד ==================

test('GET /stats returns a well-formed stats object', async () => {
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    const res = await fetch(`${BASE_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof json.data.totalProperties, 'number');
    assert.strictEqual(typeof json.data.totalCustomers, 'number');
});