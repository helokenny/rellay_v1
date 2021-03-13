'use strict';

// Creating our User model
//Set it as export because we will need it required on the server
module.exports = function(sequelize, DataTypes) {
  var Setting = sequelize.define("setting", {
    // The email cannot be null, and must be a proper email before creation
    orgId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    equal_rights:   DataTypes.BOOLEAN,
    contact_display: DataTypes.STRING,
    contact_tenure: DataTypes.INTEGER,
    contact_period: DataTypes.STRING,
    contact_expiry_action: DataTypes.STRING,
    contact_weighting: DataTypes.BOOLEAN,
    contact_msg_weight: DataTypes.DOUBLE,
    contact_call_weight: DataTypes.DOUBLE,
    contact_visit_weight: DataTypes.DOUBLE,
    joint_wallet: DataTypes.BOOLEAN,
    followup_wallet_balance: DataTypes.DOUBLE,
    members_wallet_balance: DataTypes.DOUBLE,
  }, {});

  Setting.associate = function (models) {
    Setting.belongsTo(models.Org, { 
      foreignKey: 'orgId' 
    });
  }
  

  return Setting;
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


