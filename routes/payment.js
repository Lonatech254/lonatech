// routes/paymentRoutes.js or your routes file
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController'); // Adjust path

router.post('/payment/callback', paymentController.handleMpesaCallback);
router.post('/payment/submitted', paymentController.handleMpesaSubmission);

module.exports = router;
