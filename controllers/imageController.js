const Image = require('../models/ImageSchema');
const Comment = require('../models/CommentSchema');
const Tag = require('../models/TagSchema');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

module.exports.imageForm = (req, res) => {
    Tag.find({})
    .sort({name: 1})
    .then((tags) => {
        res.render('imageForm', {nsfw: false, title: '', tags});
    })
    .catch(err => errorHandling(err));
};

module.exports.imagePost = (req, res) => {
    Tag.find({})
    .then(tags => {
        let { title, nsfw } = req.body;
        let formTags = req.body.tags;
        nsfw === 'true' ? nsfw = true : nsfw = false;
        formTags = formTags.split(', ');

        let imagePath = '/'

        if(req.file) {
            // replace \ with / so that it will be consistent on both windows and linux
            filePath = req.file.path.replace(/\\/g, '/');
            imagePath = '/' + filePath.split('/').slice(1).join('/');
        };

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
            if(req.file) {
                fs.unlinkSync(path.join(__dirname, '..', 'public', imagePath.slice(1)));
            };
            return res.render('imageForm', {errMsg: req.flash('error'), successMsg: req.flash('success'), title, nsfw, tags});
        } else {
            // image compression for thumbnails
            const fileName = `${req.file.filename.split('.')[0]}-thumbnail.jpeg`;
            let thumbnailDest = path.join(__dirname, '..', 'public', 'images', 'thumbnails', fileName);
            let dbThumbnailDest = path.join('/', 'images', 'thumbnails', fileName);

            sharp(req.file.path)
            .resize(600)
            .toFile(thumbnailDest, (err, info) => {
                if(err) errorHandling(err);

                let newImage = new Image({
                    creator: req.user._id,
                    title,
                    tags: formTags,
                    path: imagePath,
                    thumbnail: dbThumbnailDest,
                    nsfw
                })
                .save()
                .then(() => {
                    req.flash('success', 'Image uploaded successfully.');
                    return res.redirect('/upload');
                })
                .catch(err => errorHandling(err));
            });

        };
    })
    .catch(err => errorHandling(err));
};

module.exports.imagePage = (req, res) => {
    let id = req.params.id;

    if(id.length !== 24) {
        return res.render('404');
    };

    Image.findByIdAndUpdate(id, {$inc: {views: 1}})
    .then(() => {
        Image.findById(id)
        .populate('creator')
        .populate('tags')
        .sort({tags: 1})
        .exec()
        .then(image => {
            if(!image) {
                return res.render('404');
            };

            Comment.find({location: image._id})
            .populate('creator')
            .sort({created: -1})
            .exec()
            .then(comments => {
                return res.render('imagePage', {errMsg: req.flash('error'), image, comments});
            })
            .catch(err => errorHandling(err));
        })
        .catch(err => errorHandling(err));
    })
    .catch(err => errorHandling(err));
};

module.exports.imageDelete = (req, res) => {
    let id = req.params.id;
    Image.findById({_id: id})
    .then(found => {
        if((found.creator.toString() !== req.user._id.toString()) && req.user.admin === false) {
            req.flash('error', 'You lack the necessary permissions to peform this action.');
            return res.render('/');
        };

        Image.findByIdAndDelete(id)
        .then(image => {
            // on image deletion, also remove the associated files
            if(image.path && image.path !== '/') {
                // .slice(1) is so that the '/' gets removed as well.
                fs.unlinkSync(path.join(__dirname, '..', 'public', image.path.slice(1)));
               if(image.thumbnail && image.thumbnail !== '/') {
                    fs.unlinkSync(path.join(__dirname, '..', 'public', image.thumbnail.slice(1)));
               };
            };
    
            Comment.deleteMany({location: image._id})
            .then(() => {
                req.flash('success', 'Image was deleted.');
                return res.redirect('/');
            })
            .catch(err => errorHandling(err));
        })
        .catch(err => errorHandling(err));
    })
    .catch(err => errorHandling(err));
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
            return res.render('imageUpdate', {tags, image});
        })
        .catch(err => errorHandling(err));
    })
    .catch(err => errorHandling(err));
};

module.exports.imageUpdatePost = (req, res) => {
    let id = req.params.id;
    let tags = req.body.tags.split(', ');

    Image.findById({_id: id})
    .then(found => {
        if((found.creator.toString() !== req.user._id.toString()) && req.user.admin === false) {
            req.flash('error', 'You lack the necessary permissions to peform this action.');
            return res.render('/');
        };

        if(!tags || tags[0] == '') {
            req.flash('error', 'Please include at least one tag.');
            return res.redirect('');
        };
    
        Image.findByIdAndUpdate(id, {tags})
        .then((image) => {
            req.flash('Successfully updated.');
            return res.redirect(image.url);
        })
        .catch(err => errorHandling(err));
    })
    .catch(err => errorHandling(err));
};

module.exports.imageFavorite = (req, res) => {
    let id = req.params.id;

    Image.findByIdAndUpdate(id, {$push: {favorites: req.user._id}})
    .then(image => {
        req.flash('success', 'Image favorited!');
        return res.redirect(image.url);
    })
    .catch(err => errorHandling(err));
};

module.exports.imageUnfavorite = (req, res) => {
    let id = req.params.id;

    Image.findByIdAndUpdate(id, {$pull: {favorites: req.user._id}})
    .then(image => {
        req.flash('success', 'Image is no longer in your favorites!');
        return res.redirect(image.url);
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
                return res.render('index', { images, totalPages, tags, page });
            })
            .catch(err => errorHandling(err));
        })
        .catch(err => errorHandling(err));
    })
    .catch(err => errorHandling(err));
};

function errorHandling(err) {
    return console.error(err);
};