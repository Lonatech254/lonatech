const axios = require('axios');
const moment = require('moment');
const { User } = require('./models'); // Adjust path as needed

// ✅ Safaricom Daraja sandbox credentials
const consumerKey = 'X1JNfA5DTh4nNXY8gYXTlBGqmzRDXf9VJee8W6LqKhIEAuxp';
const consumerSecret = 'bKw5sTpmvBtUqidiSKKIGeoH9m8DEn59BxCXQDI2ELBzrP7CRjdyD9fGheZMABbZ';
const shortcode = '174379'; // ✅ Required sandbox Paybill (default)
const passkey = 'o3eTuCfAB9nJGCa0XirXZUrQbIs2'; // ✅ Default sandbox passkey
const callbackURL = 'https://maximum-sharp-stallion.ngrok-free.app/api/v1/payment/callback'; // ✅ Must be HTTPS (use Ngrok in dev)

async function getAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  return response.data.access_token;
}

async function payOrder(amount, orderId, userId) {
  try {
    // ✅ 1. Get user phone number
    const user = await User.findByPk(userId);
    if (!user || !user.phone) throw new Error('User phone not found');

    const phone = user.phone.startsWith('254')
      ? user.phone
      : user.phone.replace(/^0/, '254');

    // ✅ 2. Generate timestamp & password
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    // ✅ 3. Get access token
    const accessToken = await getAccessToken();

    // ✅ 4. STK Push request
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: parseInt(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: `ORDER${orderId}`,
      TransactionDesc: `Payment for Order ${orderId}`,
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { ResponseCode, CustomerMessage } = response.data;

    console.log('STK Response:', CustomerMessage);

    return ResponseCode === '0' ? 'success' : 'failed';

  } catch (error) {
    console.error('Mpesa STK Push Error:', error.response?.data || error.message);
    throw new Error('Mpesa payment failed');
  }
}

module.exports = payOrder;
