'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Requirement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        Requirement.belongsTo(models.Service, {
        foreignKey: 'service_id',
        as: 'service'
      });
    }
  }
  Requirement.init({
    service_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    order: DataTypes.INTEGER,
    is_mandatory: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Requirement',
  });
  return Requirement;
};