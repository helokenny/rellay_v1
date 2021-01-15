'use strict';

module.exports = (sequelize, DataTypes) => {
  var Template = sequelize.define('template', {
    id: {
      type:         DataTypes.INTEGER,
      primaryKey:   true,
      autoIncrement: true,
    },
    message:        DataTypes.STRING,
    recipients:     DataTypes.INTEGER,
  }, {});

  Template.associate = function (models) {
    Template.belongsTo(models.User, {
      foreignKey: 'orgId',
    });
    Template.belongsTo(models.Org, {
      foreignKey: 'userId',
    });
  }

  return Template;
}

