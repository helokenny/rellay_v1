/* 

   This module is generate random codes
   based on following arguments passed:
   n - number of characters
   typ - types of characters

*/
const jwt = require('jsonwebtoken');
const Secret = require('./cfg/_auth');
const models = require('../models');

const generateToken = async (user) => {
  const { phone, id, orgId } = user;
  const accessToken = jwt.sign({ phone, id, orgId }, Secret);

  return accessToken;
}

const verifyToken = async (req) => {
  const token_ = req.headers.authorization;
  const token = token_ ? token_.split(' ')[1] : null;
  let ret = null;

  if (token) {
    await jwt.verify(token, Secret, (err, user) => {
      if (!err) {
        ret = user;
      }
    });
  } 
  return ret;
};

module.exports = ({generateToken, verifyToken});
