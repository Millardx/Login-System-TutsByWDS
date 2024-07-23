// middleware/auth.js

// Middleware function to check if the user has a specific role
function checkRole(role) {
    return (req, res, next) => {
        // Check if user is authenticated and has the required role
        if (req.isAuthenticated() && req.user.role === role) {
            return next(); // Proceed to the next middleware or route handler
        }
        res.redirect('/login'); // Redirect to login page if user is not authenticated or role does not match
    };
}

// Middleware function to check if the user has one of the allowed roles
function checkRoles(roles) {
    return (req, res, next) => {
        // Check if user is authenticated and has one of the allowed roles
        if (req.isAuthenticated() && roles.includes(req.user.role)) {
            return next(); // Proceed to the next middleware or route handler
        }
        res.redirect('/login'); // Redirect to login page if user is not authenticated or role is not allowed
    };
}

// Export the middleware functions for use in other modules
module.exports = { checkRole, checkRoles };
