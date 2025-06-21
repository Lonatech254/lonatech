'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceStep extends Model {
    static associate(models) {
      // Belongs to a specific Service
      ServiceStep.belongsTo(models.Service, {
        foreignKey: 'service_id',
        as: 'service'
      });

      // Has many OrderSteps (if you’re tracking orders per step)
      ServiceStep.hasMany(models.OrderStep, {
        foreignKey: 'service_step_id',
        as: 'step_order'
      });
    }
  }

  ServiceStep.init({
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ServiceStep',
    tableName: 'ServiceSteps', // Optional: name consistency
    timestamps: true // Optional: add createdAt and updatedAt
  });

  return ServiceStep;
};
