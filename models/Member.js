'use strict';

module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define('member', {
    id: {
      type:     DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullname:   DataTypes.STRING,
    phone: {
      type:     DataTypes.STRING,
      unique:   'member_phone_org_composite',
    },
    orgId: {
      type:     DataTypes.INTEGER,
      unique:   'member_phone_org_composite',
    },
    userId:     DataTypes.INTEGER,
    email:      DataTypes.STRING,
    address:    DataTypes.STRING,
    gender:     DataTypes.STRING,
    agegroup:   DataTypes.STRING,
    status:     DataTypes.STRING,
    dob:        DataTypes.STRING,
    // grps:       DataTypes.STRING,
    // departmenttId: DataTypes.INTEGER,
    is_active:  DataTypes.BOOLEAN,
  })

  Member.associate = function (models) {
    Member.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Member.belongsTo(models.Org, {
      foreignKey: 'orgId'
    });
    Member.hasMany(models.Message, {
      foreignKey: 'recipient_id'
    });
    Member.belongsToMany(models.Group, {
      through: models.GroupMember, 
      foreignKey: 'memberId',
      as: 'groups',
    });
    /* Member.belongsTo(models.Department, {
      foreignKey: 'departmentId'
    }); */
  }
  
  return Member;
}

