//we import passport packages required for authentication
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
//
//We will need the models folder to check passport agains
var db = require("../models");
//
// Telling passport we want to use a Local Strategy. In other words,
//we want login with a username/phone and password
passport.use(new LocalStrategy(
  // Our user will sign in using an phone, rather than a "username"
  {
    usernameField: "phone"
  },
  function(phone, password, done) {
    // When a user tries to sign in this code runs
    db.User.findOne({
      where: {
        phone: phone
      },
      include: [{
        model: db.Org, 
        attributes: ['id', 'name', 'subname', 'generalname', 'walletbalance'],
        include: [{
          model: db.Setting, 
        }], 
      }], 

    }).then(function(dbUser) {
      // If there's no user with the given phone
      console.log('inpassport:' + JSON.stringify(dbUser));
      if (!dbUser) {
        return done(null, false, {
          message: "Incorrect Phone."
        });
      }
      // If there is a user with the given phone, but the password the user gives us is incorrect
      else if (!dbUser.validPassword(password)) {
        return done(null, false, {
          message: "Incorrect password."
        });
      }
      // If none of the above, return the user
      return done(null, dbUser);
    });
  }
));
//
// In order to help keep authentication state across HTTP requests,
// Sequelize needs to serialize and deserialize the user
// Just consider this part boilerplate needed to make it all work
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
//
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
//
// Exporting our configured passport
module.exports = passport;