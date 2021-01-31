var express = require('express');
var router = express.Router();
var cors = require("cors");

var db = require("../models");
var passport = require("../config/passport");
var contactController = require('../controllers/ContactController');
var memberController = require('../controllers/MemberController');
var templateController = require('../controllers/TemplateController');
var messageController = require('../controllers/MessageController');
var feedbackController = require('../controllers/FeedbackController');
var orgController = require('../controllers/OrgController');
var settingsController = require('../controllers/SettingsController');
const jwt = require('../config/jwt');
// Requiring our models and passport as we've configured it
//

var isAuthenticated = require("../config/middleware/isAuthenticated");
const models = require('../models');

module.exports = function(app) {
  app.get ('/api/getcontacts',   isAuthenticated, contactController.fetch);
  app.post ('/api/addcontact',   isAuthenticated, contactController.add);
  app.get ('/api/getmembers',    isAuthenticated, memberController.fetch);
  app.post ('/api/addmember',    isAuthenticated, memberController.add);
  app.get ('/api/gettemplates',  isAuthenticated, templateController.fetch);
  app.post ('/api/savetemplate',  isAuthenticated, templateController.add);
  app.get ('/api/getmessages',   isAuthenticated, messageController.fetch);
  app.post ('/api/sendmessage',  isAuthenticated, messageController.add);
  app.get ('/api/getfeedbacks',  isAuthenticated, feedbackController.fetch);
  app.post ('/api/addfeedback',  isAuthenticated, feedbackController.add);
  app.get ('/api/checkorg',      isAuthenticated, orgController.check);
  app.get ('/api/settings',      isAuthenticated, settingsController.fetch);
  app.post ('/api/settings',     isAuthenticated, settingsController.update);

  app.post("/api/login", passport.authenticate("local"), async function(req, res) {
    // console.log('passport: ' + JSON.stringify(req));
    if(req.user && req.user.id) res.json({ user: req.user, token: await jwt.generateToken(req.user) });
    else res.json({ error: "invalid" });
  });

  app.post("/api/authverify", async function(req, res) {
    let user = await jwt.verifyToken(req);
    if(user && user.id) res.json({ user });
    else res.json({ error: "invalid" });
  });

  app.post("/api/register", async function(req, res) {

    const randgen = require('../my_modules/randgen');

    console.log(req.body); 
    try {
      if(req.body.org) {
        let org_ = req.body.org;
        if(org_.org && !org_.new) {
          req.body.orgId = org_.org.id;
        } else if(org_.org && org_.new) {
          console.log('org_.org && org_.new')
        }
      } else throw 'no_org';

      let user = await db.User.create(req.body);

      await user.update({
        token: await jwt.generateToken(JSON.parse(JSON.stringify(user)))
      });

      await models.Setting.create({ orgId: org_.org.id })
      res.json({ code: "success", user });

    } catch(err) {
      console.log(JSON.stringify(err));
      let msg;
      switch (err.name) {
        case 'SequelizeUniqueConstraintError':
          msg = "Phone Number already registered for this Centre"
          break;
        default:
          msg = "An error occured. Please try again."
          break;
      }
      res.json({ code: "error", msg });
      // res.status(422).json(err.errors[0].message);
    };
  });



//
  // Route for logging user out
/*   app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });
 *///
  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    }
    else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
};


// module.exports = router;