const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String, 
        required: true, 
        lowercase: true
    },
    email: {
        type: String, 
        required: true, 
        lowercase: true
    },
    password: {
        type: String, 
        required: true
    },
    description: {
        type: String,
        default: 'No description set yet.'
    },
    profilePicture: {
        type: String,
        default: '/images/default.png'
    },
    created: {
        type: Date, 
        default: Date.now
    },
    admin: {
        type: Boolean,
        default: false
    }
});

UserSchema
.virtual('url')
.get(function() {
    return '/user/' + this._id;
});

UserSchema
.virtual('favoritesUrl')
.get(function() {
    return '/user/' + this._id + '/favorites';
});

UserSchema
.virtual('formatDate')
.get(function() {
    return this.created.toLocaleString();
});

module.exports = mongoose.model('User', UserSchema);