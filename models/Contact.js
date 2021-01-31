'use strict';

module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('contact', {
    id: {
      type:       DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullname:   DataTypes.STRING,
    phone: {
      type:     DataTypes.STRING,
      unique:   'contact_phone_org_composite',
    },
    orgId: {
      type:     DataTypes.INTEGER,
      unique:   'contact_phone_org_composite',
    },
    userId:     DataTypes.INTEGER,
    email:      DataTypes.STRING,
    address:    DataTypes.STRING,
    gender:     DataTypes.STRING,
    dob:        DataTypes.STRING,
    catg:       DataTypes.STRING,
    level:      DataTypes.DOUBLE,
    rating:     DataTypes.DOUBLE,
    is_active:  DataTypes.BOOLEAN,
    remark:     DataTypes.STRING,
  })

  Contact.associate = function (models) {
    Contact.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Contact.belongsTo(models.Org, {
      foreignKey: 'orgId'
    });
    Contact.hasMany(models.Message, {
      foreignKey: 'contactId'
    });
    Contact.hasMany(models.Feedback, {
      foreignKey: 'contactId'
    });
  }
  
  return Contact;
}

