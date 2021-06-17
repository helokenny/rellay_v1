'use strict';

// Creating our User model
//Set it as export because we will need it required on the server
module.exports = function(sequelize, DataTypes) {
  var WalletTransaction = sequelize.define("wallettransaction", {
    // The email cannot be null, and must be a proper email before creation
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    txnClass:     DataTypes.STRING,
    txnType:      DataTypes.STRING,
    txnRef:       DataTypes.STRING,
    txnId:        DataTypes.STRING,
    amount:       DataTypes.DOUBLE,
    balance:      DataTypes.DOUBLE,
  }, {});

  WalletTransaction.associate = function (models) {
    WalletTransaction.belongsTo(models.User, { 
      foreignKey: 'userId' 
    });
    WalletTransaction.belongsTo(models.Org, { 
      foreignKey: 'orgId' 
    });
  }
  

  return WalletTransaction;
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


