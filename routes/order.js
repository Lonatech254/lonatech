const express = require('express');
const orderController = require('../controllers/order.controller');
const checkAuthMiddleware   = require('../middlewares/check-auth');
const { auth } = require('../auth');
const router = express.Router();

// Import the order controller

// Example routes connected to controller methods
router.get('/', checkAuthMiddleware.admin, orderController.getOrders);
router.get('/:id', checkAuthMiddleware.check, orderController.getOrderById);
router.get('/alert/payment', checkAuthMiddleware.admin, orderController.payment);
router.get('/alert/finished', checkAuthMiddleware.admin, orderController.finished);
router.post('/create', checkAuthMiddleware.auth, orderController.createOrder);
router.post('/pay', checkAuthMiddleware.check, orderController.createPayment);
router.put('/update', checkAuthMiddleware.admin, orderController.updateOrder);
router.delete('/:id', checkAuthMiddleware.admin, orderController.deleteOrder);

module.exports = router;