require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// -----------------------
// Generate Access Token
// -----------------------
async function generateAccessToken() {
  const { CONSUMER_KEY, CONSUMER_SECRET } = process.env;
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  console.log(response.data.access_token);
  return response.data.access_token;
}

// -----------------------
// Register URLs
// -----------------------
app.get('/register-urls', async (req, res) => {
  try {
    const token = await generateAccessToken();

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl',
      {
        ShortCode: process.env.SHORTCODE,
        ResponseType: 'Completed',
        ConfirmationURL: process.env.CONFIRMATION_URL,
        ValidationURL: process.env.VALIDATION_URL,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------
// Simulate C2B Payment
// -----------------------
app.get('/simulate-payment', async (req, res) => {
  try {
    const token = await generateAccessToken();

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate',
      {
        ShortCode: process.env.SHORTCODE,
        CommandID: 'CustomerPayBillOnline',
        Amount: '100',
        Msisdn: '254708374149', // test number from Safaricom Sandbox
        BillRefNumber: 'INV001',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------
// Confirmation URL Endpoint
// -----------------------
app.post('/confirmation', (req, res) => {
  console.log('🟢 Confirmation received:', req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// -----------------------
// Validation URL Endpoint
// -----------------------
app.post('/validation', (req, res) => {
  console.log(generateAccessToken());

  // Accept the transaction
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  // Or reject like this:
  // res.status(200).json({ ResultCode: 'C2B00011', ResultDesc: 'Rejected' });
});

// -----------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
