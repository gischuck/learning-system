const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authenticate } = require('../middleware/auth');

// AI 助手聊天
router.post('/chat', authenticate, assistantController.chat);

module.exports = router;