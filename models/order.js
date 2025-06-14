'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, {
  foreignKey: 'userId',
  as: 'user'
});

Order.belongsTo(models.Service, {
  foreignKey: 'serviceId',
  as: 'service'
});

Order.hasMany(models.OrderStep, {
  foreignKey: 'order_id',
  as: 'steps'
});

  Order.hasMany(models.Payment, {
  foreignKey: 'orderId',
  as: 'payment'
});

    }
  }
  Order.init({
    userId: DataTypes.INTEGER,
    serviceId: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
    note: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};