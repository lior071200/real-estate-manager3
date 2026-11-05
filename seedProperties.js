require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('./models/Property');

const initialProperties = [
  {
    title: 'דירת 4 חדרים מרווחת',
    description: 'דירה משופצת במרכז העיר עם מרפסת שמש',
    price: 2400000,
    location: 'תל אביב',
    rooms: 4,
    sizeSqFt: 110,
    imageUrl: ''
  },
  {
    title: 'פנטהאוז יוקרתי',
    description: 'נוף מרהיב לים עם מרפסת ענקית',
    price: 5200000,
    location: 'הרצליה',
    rooms: 5,
    sizeSqFt: 200,
    imageUrl: ''
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('מחובר ל-MongoDB, ממיר נתונים סטטיים לבסיס הנתונים...');
    await Property.deleteMany({}); // מנקה נתונים כפולים
    await Property.insertMany(initialProperties);
    console.log('הנתונים הוכנסו בהצלחה ל-MongoDB Atlas!');
    process.exit();
  })
  .catch(err => {
    console.error('שגיאה בחיבור למסד הנתונים:', err);
    process.exit(1);
  });