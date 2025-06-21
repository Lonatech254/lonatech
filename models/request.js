'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    static associate(models) {
      // Belongs to a specific step of the service
      Request.belongsTo(models.ServiceProvider, {
        foreignKey: 'service_provider_id',
        as: 'developer'
      });

      // Belongs to an order
      Request.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });

    }
  }

  Request.init({
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_provider_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    note: {
      type: DataTypes.STRING,
    },
    
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'under-review', // optional default
      validate: {
        isIn: [['under-review', 'accepeted', 'rejected', 'cancelled']]
      }
    },
  }, {
    sequelize,
    modelName: 'Request',
    tableName: 'Requests', // good for clarity
    timestamps: true
  });

  return Request;
};
