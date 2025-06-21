// middleware/auth.js
const path = require('path');

exports.auth = async (req, res, next) => {
  const data = await req.userData;

  if (data) {
    return next(); // user is authenticated
  }

  const serviceId = req.body.serviceId || req.query.serviceId;

  // Redirect to auth page with serviceId in query so it can be used to auto-resubmit
  return res.redirect(`/order/auth?serviceId=${serviceId}`);
};
