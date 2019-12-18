const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/UserSchema');

module.exports.lsConfig = (passport) => {
    passport.use(new LocalStrategy(
        (username, password, done) => {
            User.findOne({username})
            .then(user => {
                if(!user) {
                    return done(null, false, {message: 'User does not exist.'});
                };

                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Incorrect password' });
                    }
                });
            })
            .catch(err => {return done(err)}); 
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id)
        .then(user => {
            return done(null, user);
        })
        .catch(err => {
            return done(err);
        });
    });
};