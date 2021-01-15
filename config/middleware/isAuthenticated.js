// This is middleware for restricting routes a user is not allowed to visit if not logged in
const sequelize = require('../db');
const jwt = require('../jwt');

module.exports = async function(req, res, next) {
  // If the user is logged in, continue with the request to the restricted route
  console.log('@isAuthenticated');
  let user = await jwt.verifyToken(req);
  console.log('@isAuthenticated: USER = ' + JSON.stringify(user));
  if(user.id) {
    req.user = user;
    next();
  }
  else res.json({ error: "invalid" });

};

