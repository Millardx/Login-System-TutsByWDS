const mongoose = require('mongoose'); // Import mongoose for MongoDB interaction

// Define the schema for the User model
const UserSchema = new mongoose.Schema({
    name: {
        type: String, // Field type is String
        required: true // Field is required
    },
    email: {
        type: String, // Field type is String
        required: true, // Field is required
        unique: true // Email must be unique in the database
    },
    password: {
        type: String, // Field type is String
        required: true // Field is required
    }

});

// Create a model named 'User' based on the UserSchema
const User = mongoose.model('User', UserSchema);

// Export the User model so it can be used in other parts of the application
module.exports = User;
