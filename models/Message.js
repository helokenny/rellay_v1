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
    recipient_id:   DataTypes.INTEGER,
    fromTemplate:   DataTypes.STRING,
    switch:         DataTypes.STRING,
  }, {});

  Message.associate = function (models) {
    Message.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Message.belongsTo(models.Org, {
      foreignKey: 'orgId',
    });
    Message.belongsTo(models.Contact, {
      foreignKey: 'recipient_id',
    });
    Message.belongsTo(models.Member, {
      foreignKey: 'recipient_id',
    });
  }

  return Message;
}

