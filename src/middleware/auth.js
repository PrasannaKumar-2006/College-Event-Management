/**
 * Authentication and Authorization Middleware
 */

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
    });
}

// Middleware to restrict access to Admin role
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access forbidden. Administrator privileges required.'
    });
}

// Middleware to restrict access to Student role
function requireStudent(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'student') {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access forbidden. Student account required.'
    });
}

module.exports = {
    isAuthenticated,
    requireAdmin,
    requireStudent
};
