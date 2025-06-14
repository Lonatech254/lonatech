'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderStep extends Model {
    static associate(models) {
      // Belongs to a specific step of the service
      OrderStep.belongsTo(models.ServiceStep, {
        foreignKey: 'service_step_id',
        as: 'step'
      });

      // Belongs to an order
      OrderStep.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });

      OrderStep.hasMany(models.Payment, {
        foreignKey: 'stepId',
        as: 'payment'
      });
    }
  }

  OrderStep.init({
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_step_id: {
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
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    sequelize,
    modelName: 'OrderStep',
    tableName: 'OrderSteps', // good for clarity
    timestamps: true
  });

  return OrderStep;
};
