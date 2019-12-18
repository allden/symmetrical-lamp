require('dotenv').config();
// express
const express = require('express');
const app = express();
const router = require('./routers/router');
const PORT = 5000 || process.env.PORT;

// db
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useUnifiedTopology: true, useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Something went wrong'));

// ejs
const expressLayouts = require('express-ejs-layouts');

// logins and error handling
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

// views related
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));

// passport and flash
app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: true}));
app.use(flash());
app.use(express.urlencoded({extended: true}));
require('./config/passportConfig').lsConfig(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.errMsg = req.flash('error');
    res.locals.successMsg = req.flash('success');
    next();
});
app.use('/', router);

// listen block
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

