const express = require('express');
const router = express.Router();
const cors = require("cors");

const sequelize = require('../config/db');
const db = require("../models");
const passport = require("../config/passport");
const contactController = require('../controllers/ContactController');
const groupController = require('../controllers/GroupController');
const memberController = require('../controllers/MemberController');
const templateController = require('../controllers/TemplateController');
const messageController = require('../controllers/MessageController');
const feedbackController = require('../controllers/FeedbackController');
const orgController = require('../controllers/OrgController');
const settingsController = require('../controllers/SettingsController');
const jwt = require('../config/jwt');
// Requiring our models and passport as we've configured it
//

const isAuthenticated = require("../config/middleware/isAuthenticated");
const models = require('../models');

module.exports = function(app) {
  /* app.get ('/api/testtest',   function (req, res) {
    console.log('I DEY SEE YOU!');
    res.send('I SEE YOU!!')
  }); */
  app.get ('/api/getcontacts',   isAuthenticated, contactController.fetch);
  app.post ('/api/addcontact',   isAuthenticated, contactController.add);
  app.get ('/api/getmembers',    isAuthenticated, memberController.fetch);
  app.post ('/api/addmember',    isAuthenticated, memberController.add);
  app.post ('/api/assignmembers',isAuthenticated, memberController.assign);
  app.get ('/api/getgroups',     isAuthenticated, groupController.fetch);
  app.post ('/api/addgroup',     isAuthenticated, groupController.add);
  app.get ('/api/gettemplates',  isAuthenticated, templateController.fetch);
  app.post ('/api/addtemplate',  isAuthenticated, templateController.add);
  app.post ('/api/updatetemplate',  isAuthenticated, templateController.update);
  app.get ('/api/getmessages',   isAuthenticated, messageController.fetch);
  app.post ('/api/sendmessage',  isAuthenticated, messageController.add);
  app.get ('/api/getfeedbacks',  isAuthenticated, feedbackController.fetch);
  app.post ('/api/addfeedback',  isAuthenticated, feedbackController.add);
  app.get ('/api/checkorg',      isAuthenticated, orgController.check);
  app.get ('/api/getsettings',   isAuthenticated, settingsController.fetch);
  app.post ('/api/savesettings', isAuthenticated, settingsController.update);

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

      const transaction = await sequelize.transaction(async (t) => { 

        let user = await db.User.create(req.body, { transaction: t });

        await user.update({
          token: await jwt.generateToken(JSON.parse(JSON.stringify(user)))
        }, { transaction: t });

        await models.Group.create({ 
          name: 'GENERAL',
          description: 'This is the general and default group for all members',
          orgId: org_.org.id,
          userId: user.id,
          type: "Functional",
        }, { transaction: t });

        await models.Setting.create({ orgId: org_.org.id }, { transaction: t });
        res.json({ code: "success", user });
      })
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

  app.get('/api/getpaymentkey', isAuthenticated, async function (req, res) {
    const key = await sequelize.query("SELECT paymentkey FROM rellayadmin", {
      type: sequelize.QueryTypes.SELECT
    });

    res.send({ status: 'success', payload: key[0].paymentkey });

  });
};


// module.exports = router;