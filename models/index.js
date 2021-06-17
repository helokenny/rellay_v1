'use strict';

var path = require('path');
var Sequelize = require('sequelize');

const sequelize = require('../config/db');

// const sequelize = new Sequelize(config.database, config.username, config.password);

const models = {
  User:            require(path.join(__dirname, './User'))(sequelize, Sequelize.DataTypes),
  Org:             require(path.join(__dirname, './Org'))(sequelize, Sequelize.DataTypes),
  Department:      require(path.join(__dirname, './Department'))(sequelize, Sequelize.DataTypes),
  Contact:         require(path.join(__dirname, './Contact'))(sequelize, Sequelize.DataTypes),
  Member:          require(path.join(__dirname, './Member'))(sequelize, Sequelize.DataTypes),
  Group:           require(path.join(__dirname, './Group'))(sequelize, Sequelize.DataTypes),
  GroupMember:     require(path.join(__dirname, './GroupMember'))(sequelize, Sequelize.DataTypes),
  Feedback:        require(path.join(__dirname, './Feedback'))(sequelize, Sequelize.DataTypes),
  Message:         require(path.join(__dirname, './Message'))(sequelize, Sequelize.DataTypes),
  Template:        require(path.join(__dirname, './Template'))(sequelize, Sequelize.DataTypes),
  Setting:         require(path.join(__dirname, './Setting'))(sequelize, Sequelize.DataTypes),
  WalletTransaction: require(path.join(__dirname, './WalletTransaction'))(sequelize, Sequelize.DataTypes),
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;