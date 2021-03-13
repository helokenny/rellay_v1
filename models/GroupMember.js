'use strict';

module.exports = (sequelize, DataTypes) => {
  const GroupMember = sequelize.define('group_member', {
    groupId: {
      type:       DataTypes.INTEGER,
      unique: 'group_member_composite',
    },
    memberId: {
      type:       DataTypes.INTEGER,
      unique: 'group_member_composite',
    },
  }, {
    timestamps: false
  })

 
  return GroupMember;
}

