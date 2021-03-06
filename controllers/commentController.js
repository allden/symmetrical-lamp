const Comment = require('../models/CommentSchema');
const Image = require('../models/ImageSchema');

module.exports.postComment = (req, res) => {
    const id = req.params.id;
    let content = req.body.content;
    let creator = req.user._id;
    let location = id;

    Image.findById(id)
    .then(image => {
        if(!content) {
            req.flash('Comment must not be empty.');
            return res.redirect(image.url);    
        };
    
        if(!req.user) {
            req.flash('You must be logged in to do this.');
            return res.redirect(image.url);
        };

        let newComment = new Comment({
            content,
            location,
            creator
        }).save()
        .then(comment => {
            Image.findByIdAndUpdate(id, {$push: {comments: comment._id}})
            .then(() => {
                req.flash('success', 'Comment posted successfully!')
                return res.redirect(image.url);
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