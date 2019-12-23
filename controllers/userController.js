const User = require('../models/UserSchema');
const Image = require('../models/ImageSchema');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');


// need to include errMsg and successMsg on every render
module.exports.registrationForm = (req, res) => {
    res.render('register', {
        username: '',
        password: '',
        password2: '',
        age: '',
        email: ''
    });
};

module.exports.registrationPost = (req, res) => {
    let { username, password, password2, age, email } = req.body;
    let errors = [];

    // validation
    if(!username || !password || !password2 || !age || !email) {
        errors.push('Please fill in all fields.');
    };

    if(/^[A-Za-z0-9]+$/.test(username) === false) {
        errors.push('Username can only contain alphanumeric symbols.');
    };

    if(username.length < 6) {
        errors.push('Username must be longer than 5 characters.');
    };

    if(password.length < 6) {
        errors.push('Password must be longer than 5 characters.');
    };

    if(password !== password2) {
        errors.push('Passwords must match.');
    };

    if(age < 13) {
        errors.push('You must be 13 or older to register.');
    };
    
    User.find({username})
    .then(foundUsers => {
        if(foundUsers.length > 0) errors.push('User already exists!');
        User.find({email})
        .then(foundEmails => {
            if(foundEmails.length > 0) errors.push('Email already exists!');
            // if errors exist, then return us back to the register Form with the values we've entered
            if(errors.length > 0) {
                req.flash('error', errors);
                reRender(req, res, username, password, password2, age, email);
            } else {
                genUser(req, res, username, password, age, email);
            };
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.loginForm = (req, res) => {
    res.render('login');
};

module.exports.loginPost = passport.authenticate('local', { successRedirect: '/',
                                                            failureRedirect: '/login',
                                                            failureFlash: true,
                                                            successFlash: 'You have successfully logged in!'});

module.exports.indexPage = (req, res) => {
    let limiter = 9;
    let page = req.query.page;
    Image.find({})
    .then(allImages => {
        let totalPages = allImages.length / limiter;
        Image.find({})
        .sort({uploaded: 'desc'})
        .limit(limiter)
        .skip(limiter*page)
        .exec()
        .then(images => {
            res.render('index', { images, totalPages });
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.logoutPage = (req, res) => {
    req.flash('success', 'You have successfully logged out.');
    req.logout();
    res.redirect('/');
};

module.exports.userPage = (req, res) => {
    let id = req.params.id;
    Image.find({})
    .then(allImages => {
        User.findById(id)
        .then(user => {
            Image.find({creator: user._id})
            .then(images => {
                res.render('userPage', {pageUser: user, images, allImages});
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};

module.exports.settingsPage = (req, res) => {
    res.render('settingsPage');
};

module.exports.settingsPageInfoPost = (req, res) => {
    let description = req.body.description || req.user.description;
    let profilePicture = req.file;
    console.log(profilePicture, description);
    if(profilePicture) {
        profilePicture = '/' + profilePicture.path.split('/').slice(1).join('/');
        if(req.user.profilePicture !== '/images/default.png') {
            fs.unlink(path.join(__dirname, '..', 'public', req.user.profilePicture), err => {
                if(err) throw err;
            });
        };
    } else {
        profilePicture = req.user.profilePicture;
    };
    console.log(profilePicture, description);

    User.findByIdAndUpdate(req.user.id, { description, profilePicture })
    .then((user) => {
        console.log(user);
        req.flash('success', 'Successfully updated.');
        res.redirect('/settings');
    })
    .catch(err => console.error(err));
};

module.exports.settingsPagePasswordPost = (req, res) => {
    let { password, password2 } = req.body;
    console.log(password, password2);
    let errors = [];
    if(password.length < 6) {
        errors.push('Password must be longer than 5 characters.');
    };

    if(password !== password2) {
        errors.push('Passwords must match.');
    };

    if(errors.length > 0) {
        req.flash('error', errors);
        res.redirect('/settings');
    } else {
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(password, salt)
            .then(hash => {
                User.findByIdAndUpdate(req.user._id, {password: hash})
                .then(() => {
                    req.flash('success', 'Password changed.');
                    res.redirect('/settings');
                })
                .catch(err => console.error(err));
            })
            .catch(err => console.err(err));
        })
        .catch(err => console.error(err));
    };
};

let reRender = (req, res, username, password, password2, age, email) => {
    res.render('register', {
        errMsg: req.flash('error'),
        successMsg: req.flash('success'),
        username,
        password,
        password2,
        age,
        email
    });
};

let genUser = (req, res, username, password, age, email) => {
    bcrypt.genSalt(10)
    .then(salt => {
        bcrypt.hash(password, salt)
        .then(hash => {
            let newUser = new User({
                username,
                password: hash,
                age,
                email
            }).save()
            .then(() => {
                req.flash('success', 'Successfully registered.');
                res.redirect('/register');
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
};