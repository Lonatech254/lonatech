const Validator = require('fastest-validator');
const models = require('../models');
const { Chat, User, Service, Order, ServiceProvider, Task } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { getIO, onlineUsers } = require('../socket');

const io = getIO();

async function send(req, res) {
  try {
    const data = await req.userData;
    const senderId = parseInt(data?.userId);

    const v = new Validator();

    const chatData = {
      order_id: parseInt(req.body.order_id),
      from: data.role,
      message: req.body.message || "",
      status: "unread"
    };

    const schema = {
      order_id: { type: "number", positive: true, integer: true },
      from: { type: "string", enum: ["client", "developer"] },
      message: { type: "string", optional: true },
      status: { type: "string", enum: ["unread", "read"] }
    };

    const validationResponse = v.validate(chatData, schema);
    if (validationResponse !== true) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationResponse,
      });
    }

    const transaction = await Chat.sequelize.transaction();

    try {
      // Create chat message
      const chat = await Chat.create(chatData, { transaction });

      await transaction.commit();

      // Fetch full chat with sender info
      const sentChat = await Chat.findOne({
        where: { id: chat.id },
        include: [
          {
            model: Order,
            as: 'order',
            include: [
              {
                model: Task,
                as: 'task',
                include: [
                  {
                    model: ServiceProvider,
                    as: 'developer',
                  }
                ]
              },
              { model: Service, as: 'service' },
            ]
          }
        ],
      });

      const resp = data.role === 'client' ? (sentChat.order?.task?.developer?.userId || 0) : sentChat.order.userId;

      const receiverSocketId = onlineUsers[resp];

      // Emit real-time message to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          id: sentChat.order.id
        });
      }

      return res.status(201).json({
        message: "Chat created successfully",
        chat: sentChat
      });

    } catch (err) {
      await transaction.rollback();
      console.error("Error creating chat:", err);
      return res.status(500).json({
        message: "Failed to send chat",
        error: err.message
      });
    }

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      message: "Unexpected server error",
      error: err.message
    });
  }
}


const getChatList = async (req, res) => {
  try {
    const data = await req.userData;
    const currentUserId = parseInt(data.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const latestChats = await Chat.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where: { userId: currentUserId },
          required: false,
          include: [
            {
              model: Task,
              as: 'task',
              include: [
                {
                  model: ServiceProvider,
                  as: 'developer',
                }
              ]
            },
            { model: Service, as: 'service' },
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!latestChats || !latestChats.length) {
      return res.status(200).json({
        user_id: currentUserId,
        currentPage: page,
        totalPages,
        chats: []
      });
    }

    const chatMap = new Map();
    latestChats.forEach(chat => {
      // Determine the other user (not current user)
      const isSender = chat.from === data.role;
      const order = chat.order;

      // Only keep one latest message per user
      if (!chatMap.has(order.id)) {

        const isRecipientOnline = !!onlineUsers[chat.order?.task?.developer?.userId];
        chatMap.set(order.id, {

          order: {
            isOnline: isRecipientOnline,
            id: order.id,
            service: order.service.name,
            serviceId: order.service.id,
            status: order.status
          },
          message: chat.message,
          createdAt: chat.createdAt,
          status: chat.status,
          isme: isSender
        });
      }
    });

    const chatsArray = Array.from(chatMap.values());
    const paginatedChats = chatsArray.slice(offset, offset + limit);
    const totalPages = Math.ceil(chatsArray.length / limit);

    return res.status(200).json({
      user_id: currentUserId,
      currentPage: page,
      totalPages,
      chats: paginatedChats
    });

  } catch (error) {
    console.error('Error fetching chat list:', error);
    return res.status(500).json({ message: 'Failed to load chat list' });
  }
}
const getProviderOrders = async (req, res) => {
  try {
    const data = await req.userData;
    const currentUserId = parseInt(data.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    if(data.role !== 'developer'){
                res.status(200).json({
                    id: currentUserId,
                    orders: [],
                });
    }
    const provider = await ServiceProvider.findOne({
      where: { userId: currentUserId },
      include: {
        model: Task,
        as: 'tasks',
        order: [['createdAt', 'DESC']],
        include: {
          model: Order,
          as: 'order',
          include: {
            model: Service,
            as: 'service'
          }
        },
      limit,
      offset
      }
    })

                res.status(200).json({
                    id: currentUserId,
                    orders: provider?.tasks.map(t => t?.order),
                });
  } catch (error) {

  }
}

const getChatsList = async (req, res) => {
  try {
    const data = await req.userData;
    const currentUserId = parseInt(data.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const latestChats = await Chat.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Task,
              as: 'task',
              include: [
                {
                  model: ServiceProvider,
                  as: 'developer',
                  where: { userId: currentUserId },
                  required: true,
                }
              ]
            },
            { model: Service, as: 'service' },
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const chatMap = new Map();

    latestChats.forEach(chat => {

      const isSender = chat.from === data.role;
      const order = chat.order;

      // Only keep one latest message per order
      if (!chatMap.has(order.id)) {

        const isRecipientOnline = !!onlineUsers[chat.order.userId];
        chatMap.set(order.id, {

          order: {
            isOnline: isRecipientOnline,
            id: order.id,
            service: order.service.name,
            serviceId: order.service.id,
            status: order.status
          },
          message: chat.message,
          createdAt: chat.createdAt,
          status: chat.status,
          isme: isSender
        });
      }
    });

    const chatsArray = Array.from(chatMap.values());
    const paginatedChats = chatsArray.slice(offset, offset + limit);
    const totalPages = Math.ceil(chatsArray.length / limit);

    return res.status(200).json({
      user_id: currentUserId,
      currentPage: page,
      totalPages,
      chats: paginatedChats
    });

  } catch (error) {
    console.error('Error fetching chat list:', error);
    return res.status(500).json({ message: 'Failed to load chat list' });
  }
};
// List chats between authenticated user and recipient
async function index(req, res) {
  try {
    const data = await req.userData;
    const user_id = parseInt(data.userId);
    const order = parseInt(req.query.order);
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    if (!order) {
      return res.status(400).json({ message: "order ID is required" });
    }

    const me = await models.User.findByPk(user_id);
    const current_order = await Order.findByPk(order, {
      include: [
        {
          model: Task,
          as: 'task',
          include: [
            {
              model: ServiceProvider,
              as: 'developer',
            }
          ]
        },
        { model: Service, as: 'service' },
      ]
    });


    if (!current_order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const chats = await models.Chat.findAndCountAll({
      where: { order_id: order },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    chats.rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));


    // Add "isMe" flag
    const chatsWithIsMe = chats.rows.map(chat => ({
      ...chat.dataValues,
      isMe: chat.from === data.role,
    }));

    // Find IDs of chats sent by recipient and received by user in the current page
    const unreadChatIds = chats.rows
      .filter(chat => chat.from !== data.role && chat.status !== 'read')
      .map(chat => chat.id);

    // Update status to 'read' only for those chats
    if (unreadChatIds.length > 0) {
      await models.Chat.update(
        { status: 'read' },
        { where: { id: { [Sequelize.Op.in]: unreadChatIds } } }
      );

      const resp = data.role === 'client' ? (current_order?.task?.developer?.userId || 0) : current_order.userId;
      // Emit socket event to notify sender that their messages were read
      const senderSocket = onlineUsers[resp];
      if (senderSocket) {
        io.to(senderSocket).emit('messagesRead', {
          sender_id: resp,
          order_id: current_order.id,
          chatIds: unreadChatIds,
        });
      }
    }

    return res.status(200).json({
      message: "Chats retrieved successfully",
      order: {
        id: current_order.id,
        status: current_order.status,
        service: current_order.service.name,
        serviceId: current_order.service.id,
      },
      chats: chatsWithIsMe,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(chats.count / limit),
        totalChats: chats.count,
      },
    });
  } catch (error) {
    console.error("Error retrieving chats:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving chats",
      error: error.message,
    });
  }
}



module.exports = {
  send,
  index,
  getChatList,
  getChatsList,
  getProviderOrders,
};
