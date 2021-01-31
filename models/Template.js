'use strict';

module.exports = (sequelize, DataTypes) => {
  var Template = sequelize.define('template', {
    id: {
      type:         DataTypes.INTEGER,
      primaryKey:   true,
      autoIncrement: true,
    },
    name:           {
      type:         DataTypes.STRING,
      unique:       'unique_template_name',
    },
    message:        DataTypes.STRING,
    recurrence:     DataTypes.STRING,
    recurrence_week:   DataTypes.INTEGER,
    recurrence_day:    DataTypes.STRING,
    recurrence_date:   DataTypes.STRING,
    bydateorday:    DataTypes.STRING,
    monthday:       DataTypes.INTEGER,
    timetosend:     DataTypes.STRING,
    status:         DataTypes.STRING,   //  ACTIVE | DISABLED | PAUSED
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

