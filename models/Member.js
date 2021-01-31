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
    dob:        DataTypes.DATE,
    catg:       DataTypes.STRING,
    departmenttId: DataTypes.INTEGER,
    is_active:  DataTypes.BOOLEAN,
    remark:     DataTypes.STRING,
  })

  Member.associate = function (models) {
    Member.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Member.belongsTo(models.Org, {
      foreignKey: 'orgId'
    });
    Member.belongsTo(models.Department, {
      foreignKey: 'departmentId'
    });
  }
  
  return Member;
}
