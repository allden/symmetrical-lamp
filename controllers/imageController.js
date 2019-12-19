const Image = require('../models/ImageSchema');
const Comment = require('../models/CommentSchema');

module.exports.imageForm = (req, res) => {
    res.render('imageForm', {nsfw: false, title: ''});
};

module.exports.imagePost = (req, res) => {
    let { title, nsfw } = req.body;
    nsfw === 'true' ? nsfw = true : nsfw = false;
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
    
    if(errors.length > 0) {
        req.flash('error', errors);
        res.render('imageForm', {errMsg: req.flash('error'), successMsg: req.flash('success'), title, nsfw});
    } else {
        let path = '/' + req.file.path.split('/').slice(1).join('/');

        let newImage = new Image({
            creator: req.user._id,
            title,
            path,
            nsfw
        }).save()
        .catch(err => console.error(err));

        req.flash('success', 'Image uploaded successfully.');
        res.redirect('/upload');
    };
};

module.exports.imagePage = (req, res) => {
    let id = req.params.id;
    Image.findById(id)
    .populate('creator')
    .exec()
    .then(image => {
        Comment.find({location: image._id})
        .populate('creator')
        .exec()
        .then(comments => {
            console.log(comments);
            res.render('imagePage', {errMsg: req.flash('error'), image, comments});
        })
        .catch(err => console.error(err));
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