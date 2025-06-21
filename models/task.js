'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      // Belongs to a specific step of the service
      Task.belongsTo(models.ServiceProvider, {
        foreignKey: 'service_provider_id',
        as: 'developer'
      });

      // Belongs to an order
      Task.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });

    }
  }

  Task.init({
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_provider_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending', // optional default
      validate: {
        isIn: [['pending', 'in_progress', 'completed', 'cancelled']]
      }
    },
  }, {
    sequelize,
    modelName: 'Task',
    tableName: 'Tasks', // good for clarity
    timestamps: true
  });

  return Task;
};
