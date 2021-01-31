'use strict';

module.exports = (sequelize, DataTypes) => {
  var Message = sequelize.define('message', {
    id: {
      type:         DataTypes.INTEGER,
      primaryKey:   true,
      autoIncrement: true,
    },
    message:        DataTypes.STRING,
    recipients:     DataTypes.INTEGER,
    contactId:      DataTypes.INTEGER,
    fromTemplate:   DataTypes.STRING,
  }, {});

  Message.associate = function (models) {
    Message.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Message.belongsTo(models.Org, {
      foreignKey: 'orgId',
    });
    Message.belongsTo(models.Contact, {
      foreignKey: 'contactId',
    });
  }

  return Message;
}

