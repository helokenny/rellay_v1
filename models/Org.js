'use strict';

// Creating our User model
//Set it as export because we will need it required on the server
module.exports = function(sequelize, DataTypes) {
  var Org = sequelize.define("org", {
    // The email cannot be null, and must be a proper email before creation
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: 'unique_user_email',
      validate: {
        isEmail: true
      }
    },
    name:   DataTypes.STRING,
    subname:   DataTypes.STRING,
    generalname:   DataTypes.STRING,
    phone:      {
      type:   DataTypes.STRING,
      unique: 'unique_user_phone',
    },
    sender:   DataTypes.STRING,
    walletbalance:   DataTypes.DOUBLE,
  }, {});

  Org.associate = function (models) {
    Org.hasMany(models.User, { 
      foreignKey: 'orgId' 
    });
    Org.hasMany(models.Contact, { 
      foreignKey: 'orgId' 
    });
    Org.hasMany(models.Template, { 
      foreignKey: 'orgId' 
    });
    Org.hasMany(models.Message, { 
      foreignKey: 'orgId' 
    });
    Org.hasOne(models.Setting, { 
      foreignKey: 'orgId' 
    });
  }
  

  return Org;
};

//This is a fix by Samaila Philemon Bala in case you want to use ES6
//and the above is not working

//User.beforeCreate(user => {
  //  user.password = bcrypt.hashSync(
    //  user.password,
      //bcrypt.genSaltSync(10),
      //null
    //);
  //});


