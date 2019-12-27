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
router.post('/image/:id/update', imageController.imageUpdatePost);
router.get('/image/:id/update', imageController.imageUpdate);
router.post('/image/:id/unfavorite', imageController.imageUnfavorite);
router.post('/image/:id/favorite', imageController.imageFavorite);
router.post('/image/:id/comment', commentController.postComment);
router.post('/image/:id/delete', imageController.imageDelete);
router.get('/image/:id', imageController.imagePage);
// user
router.get('/user/:id/favorites', userController.userFavoritesPage);
router.get('/user/:id', userController.userPage);
// settings
router.post('/settings/info', upload.single('profilePicture'), userController.settingsPageInfoPost);
router.post('/settings/password', userController.settingsPagePasswordPost);
router.get('/settings', userController.settingsPage);
// tags
router.post('/tags/create', tagController.tagsCreate);
router.post('/tags/:id/delete', tagController.tagDelete);
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
router.post('/upload', upload.single('image'), imageController.imagePost);
// default
router.get('/', userController.indexPage);
module.exports = router;