// controllers/TransactionController.js
const { Transaction } = require('../models'); // Adjust based on your models

exports.handleMpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;

    const stkCallback = Body.stkCallback;

    if (!stkCallback) {
      return res.status(400).json({ error: 'Invalid callback format' });
    }

    const merchantRequestID = stkCallback.MerchantRequestID;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // Only continue if the transaction was successful
    if (resultCode === 0) {
      const metadata = stkCallback.CallbackMetadata;
      const amount = metadata.Item.find(i => i.Name === 'Amount')?.Value || 0;
      const mpesaReceiptNumber = metadata.Item.find(i => i.Name === 'MpesaReceiptNumber')?.Value || '';
      const phone = metadata.Item.find(i => i.Name === 'PhoneNumber')?.Value || '';

      // 🔁 Save Transaction to your DB
      await Transaction.create({
        method: 'Mpesa STK Push',
        reference: mpesaReceiptNumber,
        amount,
        phone,
        status: 'paid',
        merchantRequestID,
        checkoutRequestID,
        description: resultDesc,
      });
      // You could update the related order's status here as well if needed

      return res.status(200).json({ message: 'Transaction recorded successfully' });
    } else {
      // Log or handle failed/cancelled transaction
      console.warn(`STK Push failed: ${resultDesc} (Code: ${resultCode})`);

      return res.status(200).json({ message: 'STK Push failed or cancelled' });
    }

  } catch (err) {
    console.error('Callback Error:', err.message);
    res.status(500).json({ error: 'Server error in Transaction callback' });
  }
};
exports.handleMpesaSubmission = async (req, res) => {
  try {
    const { Body } = req.body;


    console.log(req.body);

  } catch (err) {
    console.error('Callback Error:', err.message);
    res.status(500).json({ error: 'Server error in Transaction callback' });
  }
};
