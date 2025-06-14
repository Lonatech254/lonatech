'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    Payment.belongsTo(models.Order, {
  foreignKey: 'orderId',
  as: 'order'
});
    Payment.belongsTo(models.OrderStep, {
  foreignKey: 'stepId',
  as: 'step'
});

    }
  }
  Payment.init({
    orderId: DataTypes.INTEGER,
    stepId: DataTypes.INTEGER,
    transactionId: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    method: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};