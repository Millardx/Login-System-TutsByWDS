<<<<<<< HEAD
// Load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Import required modules and initialize express app
const express = require('express');
const app = express();
const bcrypt = require('bcrypt'); // For hashing passwords
const passport = require('passport'); // For authentication
const flash = require('express-flash'); // For flash messages
const session = require('express-session'); // For session management
const methodOverride = require('method-override'); // For HTTP method overriding
const mongoose = require('mongoose'); // For MongoDB interaction
const User = require('./models/User'); // User model for MongoDB

// Connect to MongoDB using the database URL from environment variables
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Initialize Passport for authentication
const initializePassport = require('./passport-config');
initializePassport(passport);

// Set view engine to EJS for rendering HTML templates
app.set('view-engine', 'ejs');

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Middleware for flash messages
app.use(flash());

// Middleware for session management with a secret key
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Middleware for Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// Middleware for HTTP method overriding (useful for forms)
app.use(methodOverride('_method'));

// Route to render the home page, accessible only to authenticated users
app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

// Route to render the login page, accessible only to non-authenticated users
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

// Route to handle login form submission using Passport's local strategy
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

// Route to render the registration page, accessible only to non-authenticated users
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

// Route to handle registration form submission, including password hashing and user saving
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash the password
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    await user.save(); // Save the new user to the database
    res.redirect('/login');
  } catch {
    res.redirect('/register'); // Redirect to register page on error
  }
});

// Route to handle user logout
app.delete('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.error(err);
      return res.sendStatus(500); // Send error status if logout fails
    }
    res.redirect('/login'); // Redirect to login page after logout
  });
});

// Middleware function to check if the user is authenticated
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // Proceed to the next middleware if authenticated
  }
  res.redirect('/login'); // Redirect to login page if not authenticated
}

// Middleware function to check if the user is not authenticated
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/'); // Redirect to home page if already authenticated
  }
  next(); // Proceed to the next middleware if not authenticated
}

// Start the server on port 3000 and log the URL
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
=======
// server.js
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const User = require('./models/User');
const { checkRole, checkRoles } = require('./middleware/auth'); // Import middleware for role-based authorization

// Load environment variables from a .env file if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Initialize Passport for authentication
const initializePassport = require('./passport-config');
initializePassport(passport);

// Set up view engine and middleware
app.set('view-engine', 'ejs'); // Set EJS as the template engine
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(flash()); // Enable flash messages for displaying errors
app.use(session({
    secret: process.env.SESSION_SECRET, // Use a session secret from environment variables
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Enable persistent login sessions
app.use(methodOverride('_method')); // Enable method override for form submissions

// Public Routes (Guest)
app.get('/guest', (req, res) => {
    res.render('guest.ejs'); // Render guest page for non-authenticated users
});

// Authenticated Routes
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name }); // Render the main page for authenticated users
});

app.get('/admin', checkRole('admin'), (req, res) => {
    res.render('admin.ejs', { name: req.user.name }); // Render admin page for users with the 'admin' role
});

app.get('/staff', checkRoles(['admin', 'staff']), (req, res) => {
    res.render('staff.ejs', { name: req.user.name }); // Render staff page for users with 'admin' or 'staff' roles
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs'); // Render login page for non-authenticated users
});

// Handle login POST request
app.post('/login', checkNotAuthenticated, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err); // Handle any errors
        }
        if (!user) {
            req.flash('error', info.message); // Display error message if user not found or incorrect password
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err); // Handle any errors during login
            }
            console.log('User logged in:', user);
            // Redirect user based on their role
            if (user.role === 'admin') {
                console.log('Redirecting to admin route');
                return res.redirect('/admin');
            } else if (user.role === 'staff') {
                console.log('Redirecting to staff route');
                return res.redirect('/staff');
            } else {
                console.log('Redirecting to root route');
                return res.redirect('/');
            }
        });
    })(req, res, next);
});

// Render registration page for non-authenticated users
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

// Handle registration POST request
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10); // Hash the password
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role // Allow role to be set during registration
        });
        await user.save(); // Save the new user to the database
        res.redirect('/login'); // Redirect to login page
    } catch {
        res.redirect('/register'); // Redirect back to registration page on error
    }
});

// Handle logout request
app.delete('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error(err);
            return res.sendStatus(500); // Send 500 status code on error
        }
        res.redirect('/login'); // Redirect to login page on successful logout
    });
});

// Middleware to check if user is authenticated
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // Proceed if authenticated
    }
    res.redirect('/login'); // Redirect to login page if not authenticated
}

// Middleware to check if user is not authenticated
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/'); // Redirect to main page if already authenticated
    }
    next(); // Proceed if not authenticated
}

// Start the server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
>>>>>>> 0b75bd62bab99798678fb814cda593e803431cfd
});
