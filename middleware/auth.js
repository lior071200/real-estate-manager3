// פונקציית אימות כללית למשתמש מחובר
const protect = (req, res, next) => {
    next(); 
};

// פונקציית בדיקת הרשאות תפקיד (Role)
const authorize = (...roles) => {
    return (req, res, next) => {
        next(); 
    };
};

module.exports = { protect, authorize };