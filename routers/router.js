const express = require('express');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/images');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: function(req, file, cb) {
        if(req.user) {
            let ext = path.extname(file.originalname);
            if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                return cb(null, false);
            };
            return cb(null, true);
        } else {
            req.flash('error', 'Please login to do this.');
            return cb(null, false);
        };
    }
});
const userController = require('../controllers/userController');
const imageController = require('../controllers/imageController');
const commentController = require('../controllers/commentController');
const tagController = require('../controllers/tagController');
const router = express.Router();

const checkAuth = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    } else {
        req.flash('error', 'Please login to view this page.');
        res.redirect('/login');
    };
};

// image
router.post('/image/:id/unfavorite', imageController.imageUnfavorite);
router.post('/image/:id/favorite', imageController.imageFavorite);
router.post('/image/:id/comment', commentController.postComment);
router.get('/image/:id', imageController.imagePage);
// tags
router.post('/tags/create', tagController.createTags);
router.post('/tags/:id/delete', tagController.deleteTag);
// user
router.get('/user/:id', userController.userPage);
// also tags
router.get('/tags', tagController.tags);
// register
router.get('/register', userController.registrationForm);
router.post('/register', userController.registrationPost);
// login
router.get('/login', userController.loginForm);
router.post('/login', userController.loginPost);
// logout
router.get('/logout', userController.logoutPage);
// upload
router.get('/upload', checkAuth, imageController.imageForm);
router.post('/upload', upload.single('image'), imageController.imagePost);
// default
router.get('/', userController.indexPage);
module.exports = router;