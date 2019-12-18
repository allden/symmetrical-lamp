const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: { 
        type: String,
        required: true
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Image'
    },
    creator: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    created: {
        type: Date,
        default: Date.now
    }
});

CommentSchema
.virtual('formatDate')
.get(function() {
    return this.created.toUTCString();
});

module.exports = mongoose.model('Comment', CommentSchema);