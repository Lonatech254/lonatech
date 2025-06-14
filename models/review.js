'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Review.belongsTo(models.Service, {
  foreignKey: 'service_id',
  as: 'service'
});

Review.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user'
});

    }
  }
  Review.init({
    user_id: DataTypes.INTEGER,
    service_id: DataTypes.INTEGER,
    rating: DataTypes.FLOAT,
    review: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};