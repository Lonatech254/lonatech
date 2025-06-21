'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceProvider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ServiceProvider.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      ServiceProvider.belongsTo(models.Service, {
        foreignKey: 'serviceId',
        as: 'service'
      });

      ServiceProvider.hasMany(models.Task, {
        foreignKey: 'service_provider_id',
        as: 'tasks'
      });
      ServiceProvider.hasMany(models.Request, {
        foreignKey: 'service_provider_id',
        as: 'requests'
      });

    }
  }
  ServiceProvider.init({    
    service_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
    },
    userId: DataTypes.INTEGER,
    serviceId: DataTypes.INTEGER,
    available: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ServiceProvider',
  });
  return ServiceProvider;
};