'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Define associations.
     * This method is automatically called by the `models/index.js` file.
     */
    static associate(models) {
      // Chat belongs to the order who sent the message
      Chat.belongsTo(models.Order, {
        as: 'order',
        foreignKey: 'order_id',
        onDelete: 'CASCADE'
      });
    }
  }

  Chat.init(
    {
      order_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      from: DataTypes.ENUM('developer', 'client'),
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'unread'
      }
    },
    {
      sequelize,
      modelName: 'Chat',
      tableName: 'Chats',
      timestamps: true
    }
  );

  return Chat;
};
