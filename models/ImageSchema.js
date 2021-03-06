const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    title: String,
    path: {
        type: String,
        required: true,
        default: '/'
    },
    thumbnail: {
        type: String,
        required: true,
        default: '/'
    },
    creator: {
        type: Schema.Types.ObjectId, 
        ref: 'User'
    },
    views: {
        type: Number,
        default: 0
    },
    favorites: [{type: Schema.Types.ObjectId, ref: 'User'}],
    tags: [{type: Schema.Types.ObjectId, ref: 'Tag'}],
    uploaded: {
        type: Date,
        default: Date.now
    },
    nsfw: {
        type: Boolean,
        default: false
    }
});

ImageSchema
.virtual('formatDate')
.get(function() {
    return this.uploaded.toLocaleString();
});

ImageSchema
.virtual('url')
.get(function() {
    return '/image/' + this._id;
});

ImageSchema
.virtual('updateUrl')
.get(function() {
    return '/image/' + this._id + '/update';
});

ImageSchema
.virtual('deleteUrl')
.get(function() {
    return '/image/' + this._id + '/delete';
});

ImageSchema
.virtual('commentUrl')
.get(function() {
    return '/image/' + this._id + '/comment';
});

ImageSchema
.virtual('favoriteUrl')
.get(function() {
    return '/image/' + this._id + '/favorite';
});

ImageSchema
.virtual('unfavoriteUrl')
.get(function() {
    return '/image/' + this._id + '/unfavorite';
});
module.exports = mongoose.model('Image', ImageSchema);