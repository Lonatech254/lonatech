const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const PORT = 8080;
const { sequelize } = require('./models');

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

//app.use(express.static('public'));

const categoryRoutes = require('./routes/category');
const serviceRoutes = require('./routes/service');
const authRoutes = require('./routes/users');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const pagesRoutes = require('./routes/pages');

app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/auth', authRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/', pagesRoutes);


server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
