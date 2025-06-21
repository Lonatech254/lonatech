const express = require('express');
const chatsController = require('../controllers/chat.controller');
const checkAuthMiddleware = require('../middlewares/check-auth');

const router = express.Router();

router.post("/send", checkAuthMiddleware.check, chatsController.send);
router.get("/all", checkAuthMiddleware.check, chatsController.getChatList);
router.get("/dev/all", checkAuthMiddleware.check, chatsController.getChatsList);
router.get("/dev/orders", checkAuthMiddleware.check, chatsController.getProviderOrders);
router.get("/", checkAuthMiddleware.check, chatsController.index);
router.get("/inbox", checkAuthMiddleware.check, async(req, res) => {
        console.log(req.userData.role)
    if(req.userData.role === 'developer'){
    res.sendFile('messages-dev.html', { root: __dirname + '/../public' });
    } else {        
    res.sendFile('messages.html', { root: __dirname + '/../public' });
    }
});
module.exports = router;