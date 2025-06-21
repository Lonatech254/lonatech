'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Service.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });

      Service.hasMany(models.Review, {
        foreignKey: 'service_id',
        as: 'reviews'
      });

      Service.hasMany(models.Order, {
        foreignKey: 'serviceId',
        as: 'orders'
      });

      Service.hasMany(models.ServiceStep, {
        foreignKey: 'service_id',
        as: 'steps'
      });

      Service.hasMany(models.Sample, {
        foreignKey: 'service_id',
        as: 'samples'
      });

      Service.hasMany(models.Requirement, {
        foreignKey: 'service_id',
        as: 'requirements'
      });
      Service.hasMany(models.ServiceProvider, {
        foreignKey: 'serviceId',
        as: 'developer'
      });

    }
  }
  Service.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    priceUnit: DataTypes.STRING,
    order: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};