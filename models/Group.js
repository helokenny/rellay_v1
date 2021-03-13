'use strict';

module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('group', {
    id: {
      type:       DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name:   {
      type:   DataTypes.STRING,
      unique: 'orgid_groupname_composite',
    },
    description:   DataTypes.STRING,
    orgId:  {
      type:   DataTypes.INTEGER,
      unique: 'orgid_groupname_composite',
    },
    userId: DataTypes.INTEGER,
    type:   DataTypes.STRING,
    forGender:  DataTypes.STRING,
    forAgegroup:DataTypes.STRING,
    forStatus:  DataTypes.STRING,
  })

  Group.associate = function (models) {
    Group.belongsTo(models.Org, {
      foreignKey: 'orgId'
    });
    Group.belongsToMany(models.Member, {
      through: models.GroupMember, 
      foreignKey: 'groupId',
      as: 'members',
    });
  }
  
  return Group;
}

