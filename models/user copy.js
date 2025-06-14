'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     */
    static associate(models) {
      // define association here  
  User.hasMany(models.Order, {
  foreignKey: 'userId',
  as: 'orders'
});

User.hasMany(models.Review, {
  foreignKey: 'user_id',
  as: 'reviews'
});

    }
  }
  User.init({
    role: DataTypes.ENUM('admin', 'developer', 'attachee', 'intern', 'client'),
    celebrity_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bio: DataTypes.TEXT,
    status: DataTypes.ENUM('active', 'inactive', 'banned'),
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    profile_pic: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};