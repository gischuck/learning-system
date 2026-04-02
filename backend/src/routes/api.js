const express = require('express');
const router = express.Router();

const noteController = require('../controllers/noteController');
const timelineController = require('../controllers/timelineController');
const familyController = require('../controllers/familyController');
const { optionalAuth, authenticate } = require('../middleware/auth');

// Notes routes - 注意：特殊路由必须在 :id 路由之前
router.get('/notes', optionalAuth, noteController.getAll);
router.get('/notes/sticky', optionalAuth, noteController.getStickyNotes);
router.post('/notes/sticky', authenticate, noteController.saveStickyNotes);
router.get('/notes/:id', optionalAuth, noteController.getById);
router.post('/notes', authenticate, noteController.create);
router.put('/notes/:id', authenticate, noteController.update);
router.delete('/notes/:id', authenticate, noteController.delete);

// Timeline routes
router.get('/timeline', optionalAuth, timelineController.getAll);
router.get('/timeline/upcoming', optionalAuth, timelineController.getUpcoming);
router.post('/timeline', authenticate, timelineController.create);
router.put('/timeline/:id', authenticate, timelineController.update);
router.delete('/timeline/:id', authenticate, timelineController.delete);

// Family routes
router.get('/family', optionalAuth, familyController.getAll);
router.post('/family', authenticate, familyController.create);

module.exports = router;