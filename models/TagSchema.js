const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new Schema({
    name: String,
    created: {
        type: Date,
        default: Date.now
    }
});

TagSchema
.virtual('url')
.get(function() {
    return '/tags/' + this._id;
});

TagSchema
.virtual('deleteUrl')
.get(function() {
    return '/tags/' + this._id + '/delete';
});

TagSchema
.virtual('formatDate')
.get(function() {
    return this.created.toUTCString();
});

module.exports = mongoose.model('Tag', TagSchema);