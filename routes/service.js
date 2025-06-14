const express = require('express');
const serviceController = require('../controllers/service.controller');

const router = express.Router();

// Example route connected to controller
//router.get('/', serviceController.getAllServices);
router.post('/', serviceController.addService);
router.get('/:id', serviceController.getServiceById);


module.exports = router;