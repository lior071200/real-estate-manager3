const fs = require('fs').promises;
const path = require('path');

const ticketsFilePath = path.join(__dirname, '../data/tickets.json');

// פונקציית עזר לקריאת הקובץ
async function readTickets() {
  try {
    const data = await fs.readFile(ticketsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// פונקציית עזר לכתיבה לקובץ
async function saveTickets(tickets) {
  await fs.writeFile(ticketsFilePath, JSON.stringify(tickets, null, 2), 'utf8');
}

// ניתוח טקסט חכם לקביעת דחיפות וקטגוריה
function analyzeTicket(title, description) {
  const fullText = `${title} ${description}`.toLowerCase();
  
  let priority = 'Medium';
  let category = 'General';

  // בדיקת דחיפות
  const urgentKeywords = ['הצפה', 'פיצוץ', 'שרוף', 'קצר', 'דליפה חמורה', 'flood', 'fire'];
  if (urgentKeywords.some(keyword => fullText.includes(keyword))) {
    priority = 'Urgent';
  }

  // סיווג קטגוריה
  if (/ברז|מים|ביוב|נזילה|צינור|כיור/.test(fullText)) {
    category = 'Plumbing';
  } else if (/חשמל|שקע|ארון חשמל|קצר|תאורה/.test(fullText)) {
    category = 'Electrical';
  } else if (/מזגן|חימום|קירור|שלט/.test(fullText)) {
    category = 'HVAC';
  }

  return { priority, category };
}

// יצירת תקלה חדשה
async function createTicket({ tenantId, propertyId, title, description, images = [] }) {
  const tickets = await readTickets();
  const { priority, category } = analyzeTicket(title, description);

  const newTicket = {
    id: Date.now().toString(), // מזהה ייחודי
    tenantId,
    propertyId,
    title,
    description,
    images,
    category,
    status: 'Open',
    priority,
    managerNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  await saveTickets(tickets);
  return newTicket;
}

// שליפת תקלות (עם סינון לפי דייר או סטטוס)
async function getTickets(filter = {}) {
  let tickets = await readTickets();

  if (filter.tenantId) {
    tickets = tickets.filter(t => t.tenantId === filter.tenantId);
  }
  if (filter.status) {
    tickets = tickets.filter(t => t.status === filter.status);
  }

  return tickets;
}

// עדכון סטטוס תקלה
async function updateTicketStatus(ticketId, { status, managerNotes, priority }) {
  const tickets = await readTickets();
  const index = tickets.findIndex(t => t.id === ticketId);

  if (index === -1) {
    return null;
  }

  if (status) tickets[index].status = status;
  if (priority) tickets[index].priority = priority;
  if (managerNotes !== undefined) tickets[index].managerNotes = managerNotes;
  tickets[index].updatedAt = new Date().toISOString();

  await saveTickets(tickets);
  return tickets[index];
}

module.exports = {
  createTicket,
  getTickets,
  updateTicketStatus
};