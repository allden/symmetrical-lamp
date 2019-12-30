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
router.post('/image/:id/update', checkAuth, imageController.imageUpdatePost);
router.get('/image/:id/update', checkAuth, imageController.imageUpdate);
router.post('/image/:id/unfavorite', checkAuth, imageController.imageUnfavorite);
router.post('/image/:id/favorite', checkAuth, imageController.imageFavorite);
router.post('/image/:id/comment', checkAuth, commentController.postComment);
router.post('/image/:id/delete', checkAuth, imageController.imageDelete);
router.get('/image/:id', imageController.imagePage);
// user
router.get('/user/:id/favorites', userController.userFavoritesPage);
router.get('/user/:id', userController.userPage);
// settings
router.post('/settings/info', checkAuth, upload.single('profilePicture'), userController.settingsPageInfoPost);
router.post('/settings/password', checkAuth, userController.settingsPagePasswordPost);
router.get('/settings', checkAuth, userController.settingsPage);
// tags
router.post('/tags/create', checkAuth, tagController.tagsCreate);
router.post('/tags/:id/delete', checkAuth, tagController.tagDelete);
router.get('/tags/:id', tagController.tagPage);
router.get('/tags', tagController.tags);
// search
router.post('/search', tagController.searchByTags);
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
router.post('/upload', checkAuth, upload.single('image'), imageController.imagePost);
// default
router.get('/', imageController.indexPage);
module.exports = router;