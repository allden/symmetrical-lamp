const Tag = require('../models/TagSchema');
const Image = require('../models/ImageSchema');

module.exports.tags = (req, res) => {
    Tag.find({})
    .then(tags => {
        res.render('tags', { tags });
    })
    .catch(err => console.error(err));
};

module.exports.tagDelete = (req, res) => {
    let id = req.params.id;

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
                res.redirect('/tags');
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.tagsCreate = (req, res) => {
    let tags = req.body.tags.split(', ');

    if(req.user.admin === false) {
        req.flash('error', 'You do not have the permissions for this.');
        res.redirect('/tags');
    };

    if(tags[0] == '') {
        req.flash('error', 'Tags must not be empty.');
        res.redirect('/tags');
    };
    
    // iterate through tags variable, replace every instance of a space with an underscore and then 
    // look for the tag in the collection, if found, do nothing, if it isn't found, create it
    let tagFunc = new Promise((resolve, reject) => {
        for(let i = 0; i < tags.length; i++) {
            let tag = tags[i].replace(' ', '_');
            Tag.findOneAndUpdate({ name: tag }, { name: tag, created: new Date() }, { upsert: true })
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
                    res.render('index', {images, tags, totalPages, page});
                })
                .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.searchByTags = (req, res) => {
    let searchParams = req.body.search.split(', ');
    let tagsMatched = [];
    let searchIteration = new Promise((resolve, reject) => {
        searchParams.forEach(param => {
            console.log(param);
            Tag.findOne({name: param})
            .then(tag => {
                tagsMatched.push(tag._id);
            })
            .catch(err => {
                console.error(err)
                reject();
            });
        })
        console.log(tagsMatched);
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
                    res.render('index', {images, totalPages, tags, page});
                })
                .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    });
}