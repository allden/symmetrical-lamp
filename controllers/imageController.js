const Image = require('../models/ImageSchema');
const Comment = require('../models/CommentSchema');
const Tag = require('../models/TagSchema');
const path = require('path');
const fs = require('fs');

module.exports.imageForm = (req, res) => {
    Tag.find({})
    .sort({name: 1})
    .then((tags) => {
        res.render('imageForm', {nsfw: false, title: '', tags});
    })
    .catch(err => console.error(err));
};

module.exports.imagePost = (req, res) => {
    Tag.find({})
    .then(tags => {
        let { title, nsfw } = req.body;
        let formTags = req.body.tags;
        nsfw === 'true' ? nsfw = true : nsfw = false;
        formTags = formTags.split(', ');
        let path = '';
        if(req.file) { path = '/' + req.file.path.split('/').slice(1).join('/'); }

        let errors = []
    
        if(!req.file) {
            errors.push('Please select an image.');
        };
    
        if(!title) {
            errors.push('Please enter a title.');
        };
        
        if(/^[A-Za-z0-9:\s!?.,]+$/.test(title) === false) {
            errors.push('Please make sure the title only consists of alphanumeric characters and punctuation.');
        };

        if(formTags[0] === '') {
            errors.push('Please include at least one tag.');
        };
        
        if(errors.length > 0) {
            req.flash('error', errors);
            res.render('imageForm', {errMsg: req.flash('error'), successMsg: req.flash('success'), title, nsfw, tags});
        } else {
            let newImage = new Image({
                creator: req.user._id,
                title,
                tags: formTags,
                path,
                nsfw
            }).save()
            .catch(err => console.error(err));
    
            req.flash('success', 'Image uploaded successfully.');
            res.redirect('/upload');
        };
    })
    .catch(err => console.error(err));
};

module.exports.imagePage = (req, res) => {
    let id = req.params.id;
    Image.findByIdAndUpdate(id, {$inc: {views: 1}})
    .then(() => {
        Image.findById(id)
        .populate('creator')
        .populate('tags')
        .sort({tags: 1})
        .exec()
        .then(image => {
            Comment.find({location: image._id})
            .populate('creator')
            .sort({created: -1})
            .exec()
            .then(comments => {
                res.render('imagePage', {errMsg: req.flash('error'), image, comments});
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.imageDelete = (req, res) => {
    let id = req.params.id;
    Image.findByIdAndDelete(id)
    .then(image => {
        fs.unlink(path.join(__dirname, '..', 'public', image.path.slice(1)), err => {
            if (err) throw err;
            Comment.deleteMany({location: image._id})
            .then(() => {
                req.flash('success', 'Image was deleted.');
                res.redirect('/');
            })
            .catch(err => console.error(err));
        });
    })
    .catch(err => console.error(err));
};

module.exports.imageUpdate = (req, res) => {
    let id = req.params.id;

    Tag.find({})
    .sort({name: 1})
    .then(tags => {
        Image.findById(id)
        .populate('tags')
        .sort({tags: 1})
        .exec()
        .then(image => {
            res.render('imageUpdate', {tags, image});
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.imageUpdatePost = (req, res) => {
    let id = req.params.id;
    let tags = req.body.tags.split(', ');

    if(tags[0] == '') {
        req.flash('error', 'Please include at least one tag.');
        res.redirect('');
    };

    Image.findByIdAndUpdate(id, {tags})
    .then((image) => {
        req.flash('Successfully updated.');
        res.redirect(image.url);
    })
    .catch(err => console.error(err));
};

module.exports.imageFavorite = (req, res) => {
    let id = req.params.id;

    Image.findByIdAndUpdate(id, {$push: {favorites: req.user._id}})
    .then(image => {
        req.flash('success', 'Image favorited!');
        res.redirect(image.url);
    })
    .catch(err => console.error(err));
};

module.exports.imageUnfavorite = (req, res) => {
    let id = req.params.id;

    Image.findByIdAndUpdate(id, {$pull: {favorites: req.user._id}})
    .then(image => {
        req.flash('success', 'Image is no longer in your favorites!');
        res.redirect(image.url);
    })
};

module.exports.indexPage = (req, res) => {
    let limiter = 9;
    let page = req.query.page || 0;
    
    Tag.find({})
    .sort({name: 1})
    .then(tags => {
        Image.find({})
        .then(allImages => {
            let totalPages = Math.ceil(allImages.length / limiter);
            Image.find({})
            .sort({uploaded: 'desc'})
            .limit(limiter)
            .skip(limiter*page)
            .exec()
            .then(images => {
                res.render('index', { images, totalPages, tags, page });
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};