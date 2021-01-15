/* 

   This module is just to establish
   connection to the MySql database

*/

// var mysql = require('mysql');
const Sequelize = require('sequelize');
const dbauth = require('./cfg/dbauth')("local");    //  local | aws

module.exports = new Sequelize(dbauth.dbdb, dbauth.dbuser, dbauth.dbpwrd, {
  
  host: dbauth.dbhost,
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 20000
  },

  logging: true,
  
});
