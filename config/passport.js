const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


// Load User model
const Room = mongoose.model('Room');

module.exports = function(passport) {
  passport.use(
      new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
        // console.log(email);

        // Match user
        Room.findOne({code: username }).then(user => {
          if (!user) {
            return done(null, false, { message: 'That email is not registered' });
          }

          // Match password
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Password incorrect' });
            }
          });
        });
      })
  );


  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    Room.findById(id, function(err, user) {
      done(err, user);
    });
  });
};
