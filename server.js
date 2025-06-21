const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);

const socketIo = require('socket.io');

const socket = require('./socket');
const io = socket.init(server);


const PORT = 3000;
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
app.use("/chats", require("./routes/chats"));
app.use("/tasks", require("./routes/task"));


const TARGET_URL = "https://dramaspot.onrender.com";

// === AUTO-PING EVERY 13 MINUTES === ✅
if (TARGET_URL) {
    setInterval(() => {
        fetch(`${TARGET_URL}`)
            .then(res => res.text())
            .then(body => console.log(`✅ Pinged ${TARGET_URL} — ${body}`))
            .catch(err => console.error(`❌ Failed to ping ${TARGET_URL}: ${err.message}`));
    }, 780000); // 13 minutes in milliseconds
}


server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
