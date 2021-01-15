'use strict';

module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('department', {
    id: {
      type:       DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name:         DataTypes.STRING,
    orgId:        DataTypes.INTEGER,
    memberscount: DataTypes.INTEGER,
    email:        DataTypes.STRING,
    description:  DataTypes.STRING,
  })

  Department.associate = function (models) {
    Department.hasMany(models.Member, {
      foreignKey: 'departmentId',
    });
    Department.belongsTo(models.Org, {
      foreignKey: 'orgId',
    });
  }
  
  return Department;
}

