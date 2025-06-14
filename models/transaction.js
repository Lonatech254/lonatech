'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Transaction.init({
    method: DataTypes.STRING,
    status: DataTypes.STRING,
    reference: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    phone: DataTypes.STRING,
    merchantRequestID: DataTypes.STRING,
    checkoutRequestID: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};