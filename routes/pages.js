const express = require('express');
const checkAuthMiddleware   = require('../middlewares/check-auth');
const router = express.Router();

router.get('/', checkAuthMiddleware.isUser, async (req, res) => {
    res.sendFile('index.html', { root: __dirname + '/../public' });
});

router.get('/categories', checkAuthMiddleware.isUser, async (req, res) => {
    res.sendFile('categories.html', { root: __dirname + '/../public' });
});
router.get('/service', checkAuthMiddleware.isUser, async (req, res) => {
    res.sendFile('service.html', { root: __dirname + '/../public' });
});
router.get('/category', checkAuthMiddleware.isUser, async (req, res) => {
    res.sendFile('category.html', { root: __dirname + '/../public' });
});
router.get('/order', checkAuthMiddleware.check, async (req, res) => {
    res.sendFile('order.html', { root: __dirname + '/../public' });
});
router.get('/order/auth', async (req, res) => {
    res.sendFile('order_auth.html', { root: __dirname + '/../public' });
});
router.get('/orders', checkAuthMiddleware.admin, async (req, res) => {
    res.sendFile('orders.html', { root: __dirname + '/../public' });
});
router.get('/add', checkAuthMiddleware.admin, async (req, res) => {
    res.sendFile('add-service.html', { root: __dirname + '/../public' });
});
router.get('/blog', checkAuthMiddleware.check, async (req, res) => {
    res.sendFile('blog.html', { root: __dirname + '/../public' });
});
router.get('/chat', checkAuthMiddleware.check, async (req, res) => {
    res.sendFile('messages.html', { root: __dirname + '/../public' });
});
router.get('/admin/order', checkAuthMiddleware.admin, async (req, res) => {
    res.sendFile('order-admin.html', { root: __dirname + '/../public' });
});

router.get('/logo', async (req, res) => {
    res.sendFile('assets/images/cover2.png', { root: __dirname + '/../public' });
});

module.exports = router;