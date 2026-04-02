const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

// 同步状态
router.get('/status', syncController.getStatus);

// 完整同步
router.post('/all', syncController.syncAll);

// 单独同步各项
router.post('/plans', syncController.syncPlans);
router.post('/todos', syncController.syncTodos);
router.post('/notes', syncController.syncNotes);
router.post('/wishes', syncController.syncWishes);
router.post('/assignments', syncController.syncAssignments);
router.post('/stars', syncController.syncStars);
router.post('/habits', syncController.syncHabits);

// 数据导入导出
router.post('/export', syncController.exportData);
router.post('/import', syncController.importData);
router.post('/backup', syncController.backupDatabase);

module.exports = router;
