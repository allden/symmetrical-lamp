const Tag = require('../models/TagSchema');
const Image = require('../models/ImageSchema');

module.exports.tags = (req, res) => {
    if(req.user.admin === false) {
        req.flash('error', 'You do not have permission to access this resource.');
        return res.redirect('/');
    };

    Tag.find({})
    .then(tags => {
        res.render('tags', { tags });
    })
    .catch(err => errorHandling(err));
};

module.exports.tagDelete = (req, res) => {
    let id = req.params.id;

    if(req.user.admin) {
        Tag.findByIdAndDelete(id)
        .then((tag) => {
            Image.find({tags: tag._id})
            .then(images => {
                let deleteAllInstances = new Promise((resolve, reject) => {
                    let existing = [];
                    for(let i = 0; i < images.length; i++) {
                        existing.push(images[i]._id);
                    };
        
                    existing.forEach(imgId => {
                        Image.findByIdAndUpdate(imgId, {tags: {$pull: {tags: tag._id}}});
                    });
    
                    resolve();
                });
    
                deleteAllInstances.then(() => {
                    req.flash('success', 'Successfully deleted.');
                    return res.redirect('/tags');
                })
                .catch(err => errorHandling(err));
            })
            .catch(err => errorHandling(err));
        })
        .catch(err => errorHandling(err));
    } else {
        req.flash('error', 'You do not have the permissions to do perform this action.');
        return res.redirect('/tags');
    };
};

module.exports.tagsCreate = (req, res) => {
    let tags = req.body.tags.split(', ');

    if(req.user.admin === false) {
        req.flash('error', 'You do not have the permissions to do perform this action.');
        return res.redirect('/tags');
    };

    if(tags[0] == '') {
        req.flash('error', 'Tags must not be empty.');
        return res.redirect('/tags');
    };
    
    // iterate through tags variable, replace every instance of a space with an underscore and then 
    // look for the tag in the collection, if found, do nothing, if it isn't found, create it
    let tagFunc = new Promise((resolve, reject) => {
        for(let i = 0; i < tags.length; i++) {
            let tag = tags[i].replace(' ', '_');
            Tag.findOneAndUpdate({ name: tag }, { name: tag, created: new Date() }, { upsert: true })
            .then(doc => console.log(doc))
            .catch(err => errorHandling(err));
            if(i === tags.length-1) resolve();
        };
    });

    tagFunc.then(() => {
        req.flash('success', 'Successfully created tag(s).');
        return res.redirect('/tags');
    })
    .catch(err => errorHandling(err));
};

module.exports.tagPage = (req, res) => {
    let id = req.params.id;
    let page = req.query.page || 0;
    let limiter = 9;

    Tag.find({})
    .then(tags => {
        Tag.findById(id)
        .then(tag => {
            Image.find({tags: tag._id})
            .then(allImages => {
                let totalPages = Math.ceil(allImages.length / limiter);
                Image.find({tags: tag._id})
                .limit(limiter)
                .skip(limiter * page)
                .then(images => {
                    return res.render('index', {images, tags, totalPages, page});
                })
                .catch(err => errorHandling(err));
            })
            .catch(err => errorHandling(err));
        })
        .catch(err => errorHandling(err));
    })
    .catch(err => errorHandling(err));
};

module.exports.searchByTags = (req, res) => {
    let searchParams = req.body.search.split(', ');
    let tagsMatched = [];
    let searchIteration = new Promise((resolve, reject) => {
        searchParams.forEach(param => {
            Tag.findOne({name: param})
            .then(tag => {
                tagsMatched.push(tag._id);
            })
            .catch(err => {
                errorHandling(err)
                reject();
            });
        })

        resolve();
    });

    searchIteration.then(() => {
        let limiter = 9;
        let page = req.query.page;
        Tag.find({})
        .then(tags => {
            Image.find({tags: {$all: tagsMatched}})
            .then(allImages => {
                let totalPages = allImages.length / limiter;
                Image.find({tags: {$all: tagsMatched}})
                .limit(limiter)
                .skip(limiter * page)
                .then(images => {
                    return res.render('index', {images, totalPages, tags, page});
                })
                .catch(err => errorHandling(err));
            })
            .catch(err => errorHandling(err));
        })
        .catch(err => errorHandling(err));
    });
};

function errorHandling(err) {
    return console.error(err);
};