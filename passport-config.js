const LocalStrategy = require('passport-local').Strategy; // Import LocalStrategy for username/password authentication
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing and comparison
const User = require('./models/User'); // Import User model for database operations

// Initialize Passport with the provided strategy
function initialize(passport) {
    // Function to authenticate user based on email and password
    const authenticateUser = async (email, password, done) => {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // If no user is found, return with a message
            return done(null, false, { message: 'No user with that email' });
        }

        try {
            // Compare provided password with hashed password in the database
            if (await bcrypt.compare(password, user.password)) {
                // If passwords match, return the user
                return done(null, user);
            } else {
                // If passwords do not match, return with a message
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (e) {
            // Return any errors encountered
            return done(e);
        }
    };

    // Use LocalStrategy with email as the username field
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

    // Serialize user information to store in session (storing user ID)
    passport.serializeUser((user, done) => done(null, user.id));

    // Deserialize user information from session (retrieving user by ID)
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user); // Return the user object
        } catch (err) {
            done(err, null); // Return error if user not found
        }
    });
}

module.exports = initialize; // Export the initialize function to set up Passport
