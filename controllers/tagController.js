const Tag = require('../models/TagSchema');

module.exports.tags = (req, res) => {
    Tag.find({})
    .then(tags => {
        res.render('tags', { tags });
    })
    .catch(err => console.error(err));
};

module.exports.deleteTag = (req, res) => {
    let id = req.params.id;

    Tag.findByIdAndDelete(id)
    .then(() => {
        req.flash('success', 'Successfully deleted.');
        res.redirect('/tags');
    })
    .catch(err => console.error(err));
};

module.exports.createTags = (req, res) => {
    let tags = req.body.tags.split(', ');

    if(req.user.admin === false) {
        req.flash('error', 'You do not have the permissions for this.');
        res.redirect('/tags');
    };

    if(!tags) {
        req.flash('error', 'Tags must not be empty.');
        res.redirect('/tags');
    };
    
    let tagFunc = new Promise((resolve, reject) => {
        for(let i = 0; i < tags.length; i++) {
            let tag = tags[i].replace(' ', '_');
            Tag.findOneAndUpdate({ name: tag }, { name: tag}, { upsert: true })
            .then(doc => console.log(doc))
            .catch(err => console.error(err));
            if(i === tags.length-1) resolve();
        };
    });

    tagFunc.then(() => {
        req.flash('success', 'Successfully created tag(s).');
        res.redirect('/tags');
    })
    .catch(err => console.error(err));
};