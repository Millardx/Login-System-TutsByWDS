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
});
