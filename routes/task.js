const express = require('express');

const router = express.Router();

router.get('/pending', require('../controllers/task.controller').asignTasks);

module.exports = router;