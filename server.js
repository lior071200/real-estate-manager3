// 1. ייבוא ספריות וראוטרים
const express = require('express');
const app = express();
const cors = require('cors'); // מאפשר חיבור מה-Frontend
const bodyParser = require('body-parser'); // מאפשר קריאת נתונים מ-POST
const fs = require('fs'); // קריאה/כתיבה לקבצים - משמש כמסד הנתונים שלנו
const path = require('path');
const http = require('http'); // נדרש כדי לחבר את שרת ה-WebSocket לאותו שרת HTTP
const bcrypt = require('bcryptjs'); // הצפנת סיסמאות
const jwt = require('jsonwebtoken'); // ניהול טוקני התחברות
const ExcelJS = require('exceljs'); // ייצוא דוחות לאקסל
const WebSocket = require('ws'); // עדכונים בזמן אמת
const { trainLinearRegression, predict: predictWithModel } = require('./linearRegression');
const { CITIES, extractFeatures, computeMatches, computeStats, filterByDateRange } = require('./businessLogic');
const { analyzeRealEstateData } = require('./statisticsService');
// הגשת קבצים סטטיים (HTML, CSS, JS של הלקוח)
app.use(express.static(path.join(__dirname, '../public')));

const properties = [
  {
    id: 1,
    title: "בניין מגורים מודרני",
    type: "בניין",
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800",
    price: 2800000,
    city: "תל אביב",
    description: "בניין מגורים חדיש ומפואר במיקום מרכזי."
  },
  {
    id: 2,
    title: "דירה למכירה - סלון מרווח",
    type: "דירה",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
    price: 1950000,
    city: "רמת גן",
    description: "דירה מוארת ומרווחת עם סלון מעוצב."
  },
  {
    id: 3,
    title: "בית פרטי יוקרתי",
    type: "בית פרטי",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800",
    price: 4500000,
    city: "הרצליה",
    description: "וילה יוקרתית עם גינה רחבת ידיים ובריכה."
  },
  {
    id: 4,
    title: "עיצוב פנים דירה",
    type: "דירה מעוצבת",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
    price: 2200000,
    city: "ראשון לציון",
    description: "דירה בעיצוב פנים אדריכלי ברמה הגבוהה ביותר."
  }
];

// ייבוא ראוטרים חיצוניים
const ticketRoutes = require('./routes/ticketRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const propertiesRoutes = require('./routes/propertiesRoutes');

// 2. הגדרת Middleware (תוכנות ביניים)
app.use(cors()); // הפעלת CORS לכל הבקשות
app.use(bodyParser.json()); // מאפשר קריאת גוף בקשת JSON

// מגיש את קובץ ה-index.html (ושאר קבצי ה-frontend) ישירות מהשרת
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. חיבור ה-Routes
app.use('/api/properties-search', propertiesRoutes);
app.use(statisticsRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/properties', propertiesRoutes);

// Endpoint ישיר לסטטיסטיקות מאקסל
app.get('/api/statistics', async (req, res) => {
  try {
    const data = await analyzeRealEstateData(path.join(DATA_DIR, 'real_estate.xlsx'));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'real-estate-ai-secret-key-change-in-production';
const TOKEN_EXPIRY = '2h';
const PORT = process.env.PORT || 5000;

// 4. יצירת מופע של הראוטר (Router) והגדרת API
const router = express.Router();

// ================== "מסד נתונים" מבוסס קבצי JSON ==================

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const TRAINING_DATA_FILE = path.join(DATA_DIR, 'training-data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// יצירת תיקיית הנתונים וקבצי ברירת מחדל אם הם לא קיימים עדיין
function ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(PROPERTIES_FILE)) {
        const defaultProperties = [
            { id: 1, address: 'הרצל 12', city: 'Tel Aviv', rooms: 3, size: 85, type: 'למכירה', price: 3200000, agent: 'דוד לוי', status: 'זמין' },
            { id: 2, address: 'ז\'בוטינסקי 45', city: 'Ramat Gan', rooms: 4, size: 105, type: 'להשכרה', price: 7500, agent: 'מיכל כהן', status: 'זמין' }
        ];
        fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(defaultProperties, null, 4), 'utf8');
    }

    if (!fs.existsSync(CUSTOMERS_FILE)) {
        const defaultCustomers = [
            { id: 1, name: 'יוסי כהן', phone: '050-1234567', budget: 3500000, preferredCity: 'Tel Aviv', minRooms: 3 },
            { id: 2, name: 'רונית לוי', phone: '052-7654321', budget: 8000, preferredCity: 'Ramat Gan', minRooms: 3 }
        ];
        fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(defaultCustomers, null, 4), 'utf8');
    }

    if (!fs.existsSync(USERS_FILE) || fs.readFileSync(USERS_FILE, 'utf8').trim() === '[]') {
        const defaultUsers = [
            { id: 1, username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin' },
            { id: 2, username: 'viewer', passwordHash: bcrypt.hashSync('viewer123', 10), role: 'viewer' }
        ];
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 4), 'utf8');
        console.log('נוצרו משתמשי ברירת מחדל: admin/admin123 (מנהל), viewer/viewer123 (צפייה בלבד)');
    }
}

function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function readProperties() {
    return JSON.parse(fs.readFileSync(PROPERTIES_FILE, 'utf8'));
}

function writeProperties(data) {
    fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(data, null, 4), 'utf8');
}

function readCustomers() {
    return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8'));
}

function writeCustomers(data) {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(data, null, 4), 'utf8');
}

ensureDataFiles();

// ================== מודל AI - רגרסיה לינארית להערכת מחירים ==================

let saleModel = null;
let rentModel = null;
let modelTrainedAt = null;

function trainModels() {
    const trainingData = JSON.parse(fs.readFileSync(TRAINING_DATA_FILE, 'utf8'));

    const saleRows = trainingData.filter(r => r.type === 'למכירה');
    const rentRows = trainingData.filter(r => r.type === 'להשכרה');

    if (saleRows.length >= 11) {
        const X = saleRows.map(extractFeatures);
        const y = saleRows.map(r => r.price);
        saleModel = trainLinearRegression(X, y);
    }

    if (rentRows.length >= 11) {
        const X = rentRows.map(extractFeatures);
        const y = rentRows.map(r => r.price);
        rentModel = trainLinearRegression(X, y);
    }

    modelTrainedAt = new Date().toISOString();
    console.log(`AI model trained on ${saleRows.length} sale + ${rentRows.length} rent records`);
}

trainModels(); // אימון בעת עליית השרת

// ================== אימות (Authentication) ==================

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'נדרשת התחברות (חסר טוקן)' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'טוקן לא תקף או שפג תוקפו' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'הפעולה מותרת למנהלים בלבד' });
    }
    next();
}

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'נא למלא שם משתמש וסיסמה' });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
        success: true,
        token,
        user: { username: user.username, role: user.role }
    });
});

//router.use(requireAuth);

// ================== נתיבי API לנכסים (Properties) ==================

router.get('/properties', (req, res) => {
    const { search } = req.query;
    let result = readProperties();

    if (search) {
        const term = search.toLowerCase();
        result = result.filter(p =>
            p.address.toLowerCase().includes(term) ||
            p.city.toLowerCase().includes(term)
        );
    }

    res.json({ success: true, data: result });
});

router.get('/properties/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const properties = readProperties();
    const property = properties.find(p => p.id === id);

    if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, data: property });
});

router.post('/properties', (req, res) => {
    const { address, city, rooms, size, type, price, agent } = req.body;

    if (!address || !city || !rooms || !size || !type || !price || !agent) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const properties = readProperties();
    const nextId = properties.length > 0 ? Math.max(...properties.map(p => p.id)) + 1 : 1;

    const newProperty = {
        id: nextId,
        address,
        city,
        rooms: Number(rooms),
        size: Number(size),
        type,
        price: Number(price),
        agent,
        status: 'זמין',
        createdAt: new Date().toISOString(),
        priceHistory: [{ price: Number(price), date: new Date().toISOString() }]
    };

    properties.push(newProperty);
    writeProperties(properties);
    broadcast({ type: 'property_created', entity: newProperty, byUser: req.user?.username || 'admin' });
    res.status(201).json({ success: true, data: newProperty });
});

router.put('/properties/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const properties = readProperties();
    const index = properties.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const { address, city, rooms, size, type, price, agent } = req.body;
    const priceChanged = price !== undefined && Number(price) !== properties[index].price;

    properties[index] = {
        ...properties[index],
        address: address ?? properties[index].address,
        city: city ?? properties[index].city,
        rooms: rooms !== undefined ? Number(rooms) : properties[index].rooms,
        size: size !== undefined ? Number(size) : properties[index].size,
        type: type ?? properties[index].type,
        price: price !== undefined ? Number(price) : properties[index].price,
        agent: agent ?? properties[index].agent
    };

    if (priceChanged) {
        if (!Array.isArray(properties[index].priceHistory)) properties[index].priceHistory = [];
        properties[index].priceHistory.push({ price: Number(price), date: new Date().toISOString() });
    }

    writeProperties(properties);
    broadcast({ type: 'property_updated', entity: updatedProperty, byUser: req.user?.username || 'admin' });
    res.json({ success: true, data: properties[index] });
});

router.get('/properties/:id/price-history', (req, res) => {
    const id = parseInt(req.params.id);
    const property = readProperties().find(p => p.id === id);

    if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.json({ success: true, data: property.priceHistory || [] });
});

router.delete('/properties/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const properties = readProperties();
    const index = properties.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const deleted = properties[index];
    properties.splice(index, 1);
    writeProperties(properties);
    broadcast({ type: 'property_deleted', entity: deleted, byUser: req.user.username });
    res.json({ success: true, message: 'Property deleted' });
});

// ================== נתיבי API ללקוחות (Customers) ==================

router.get('/customers', (req, res) => {
    res.json({ success: true, data: readCustomers() });
});

router.get('/customers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const customers = readCustomers();
    const customer = customers.find(c => c.id === id);

    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
});

router.post('/customers', requireAdmin, (req, res) => {
    const { name, phone, budget, preferredCity, minRooms } = req.body;

    if (!name || !phone || !budget || !preferredCity || !minRooms) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const customers = readCustomers();
    const nextId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;

    const newCustomer = {
        id: nextId,
        name,
        phone,
        budget: Number(budget),
        preferredCity,
        minRooms: Number(minRooms),
        createdAt: new Date().toISOString()
    };

    customers.push(newCustomer);
    writeCustomers(customers);
    broadcast({ type: 'customer_created', entity: newCustomer, byUser: req.user.username });
    res.status(201).json({ success: true, data: newCustomer });
});

router.put('/customers/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const customers = readCustomers();
    const index = customers.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { name, phone, budget, preferredCity, minRooms } = req.body;

    customers[index] = {
        ...customers[index],
        name: name ?? customers[index].name,
        phone: phone ?? customers[index].phone,
        budget: budget !== undefined ? Number(budget) : customers[index].budget,
        preferredCity: preferredCity ?? customers[index].preferredCity,
        minRooms: minRooms !== undefined ? Number(minRooms) : customers[index].minRooms
    };

    writeCustomers(customers);
    broadcast({ type: 'customer_updated', entity: customers[index], byUser: req.user.username });
    res.json({ success: true, data: customers[index] });
});

router.delete('/customers/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const customers = readCustomers();
    const index = customers.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const deleted = customers[index];
    customers.splice(index, 1);
    writeCustomers(customers);
    broadcast({ type: 'customer_deleted', entity: deleted, byUser: req.user.username });
    res.json({ success: true, message: 'Customer deleted' });
});

router.get('/customers/:id/matches', (req, res) => {
    const id = parseInt(req.params.id);
    const customers = readCustomers();
    const customer = customers.find(c => c.id === id);

    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const properties = readProperties();
    const matches = computeMatches(customer, properties);

    res.json({ success: true, data: matches });
});

// ================== חיזוי מחיר AI ==================

router.post('/predict', (req, res) => {
    const { rooms, size, city, type } = req.body;

    if (!rooms || !size || !city) {
        return res.status(400).json({ success: false, message: "Missing required fields: rooms, size, or city." });
    }

    if (!CITIES.includes(city)) {
        return res.status(400).json({ success: false, message: `Unsupported city. Supported: ${CITIES.join(', ')}` });
    }

    const model = type === 'להשכרה' ? rentModel : saleModel;

    if (!model) {
        return res.status(503).json({ success: false, message: 'המודל עדיין לא אומן - חסר דאטה מספיק' });
    }

    const features = extractFeatures({ rooms, size, city });
    const predictedPrice = Math.round(predictWithModel(model, features));

    res.json({
        success: true,
        prediction: Math.max(predictedPrice, 0),
        model: {
            type: 'linear_regression',
            trainedOn: type === 'להשכרה' ? 'rent_records' : 'sale_records',
            trainedAt: modelTrainedAt
        }
    });
});

router.get('/model-info', (req, res) => {
    res.json({
        success: true,
        data: {
            algorithm: 'Multiple Linear Regression (Normal Equations)',
            features: ['rooms', 'size', 'city (one-hot)'],
            saleModelCoefficients: saleModel,
            rentModelCoefficients: rentModel,
            trainedAt: modelTrainedAt
        }
    });
});

// ================== דוחות Excel ==================

router.get('/reports/properties.xlsx', async (req, res) => {
    const { from, to } = req.query;
    const properties = filterByDateRange(readProperties(), from, to);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('נכסים');

    sheet.columns = [
        { header: 'מזהה', key: 'id', width: 8 },
        { header: 'כתובת', key: 'address', width: 30 },
        { header: 'עיר', key: 'city', width: 15 },
        { header: 'חדרים', key: 'rooms', width: 10 },
        { header: 'גודל (מ"ר)', key: 'size', width: 12 },
        { header: 'סוג עסקה', key: 'type', width: 12 },
        { header: 'מחיר (₪)', key: 'price', width: 15 },
        { header: 'סוכן', key: 'agent', width: 20 },
        { header: 'נוצר בתאריך', key: 'createdAt', width: 20 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ rightToLeft: true }];

    properties.forEach(p => sheet.addRow(p));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="properties-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
});

router.get('/reports/customers.xlsx', async (req, res) => {
    const { from, to } = req.query;
    const customers = filterByDateRange(readCustomers(), from, to);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('לקוחות');

    sheet.columns = [
        { header: 'מזהה', key: 'id', width: 8 },
        { header: 'שם', key: 'name', width: 20 },
        { header: 'טלפון', key: 'phone', width: 15 },
        { header: 'תקציב (₪)', key: 'budget', width: 15 },
        { header: 'עיר מועדפת', key: 'preferredCity', width: 15 },
        { header: 'מינימום חדרים', key: 'minRooms', width: 15 },
        { header: 'נוצר בתאריך', key: 'createdAt', width: 20 }
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ rightToLeft: true }];

    customers.forEach(c => sheet.addRow(c));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="customers-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
});

// ================== דשבורד סטטיסטיקות ==================

router.get('/stats', (req, res) => {
    const properties = readProperties();
    const customers = readCustomers();

    res.json({
        success: true,
        data: computeStats(properties, customers)
    });
});

app.use('/api', router);

// ================== עדכונים בזמן אמת (WebSockets) והפעלת השרת ==================

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    try {
        ws.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        ws.close(1008, 'Invalid or missing token');
        return;
    }

    console.log(`WebSocket connected: ${ws.user.username}`);
});

function broadcast(event) {
    const message = JSON.stringify({ ...event, timestamp: new Date().toISOString() });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Data files stored in: ${DATA_DIR}`);
});