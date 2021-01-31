'use strict';

module.exports = (sequelize, DataTypes) => {
  var Feedback = sequelize.define('feedback', {
    id: {
      type:         DataTypes.INTEGER,
      primaryKey:   true,
      autoIncrement: true,
    },
    remark:         DataTypes.STRING,
    medium:         DataTypes.STRING,
    rating:         DataTypes.DOUBLE,
  }, {});

  Feedback.associate = function (models) {
    Feedback.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Feedback.belongsTo(models.Org, {
      foreignKey: 'orgId',
    });
    Feedback.belongsTo(models.Contact, {
      foreignKey: 'contactId',
    });
  }

  return Feedback;
}

