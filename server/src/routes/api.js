const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/auth');
const tasksController = require('../controllers/tasks');
const coursesController = require('../controllers/courses');
const analyticsController = require('../controllers/analytics');
const socialsController = require('../controllers/socials');
const aiController = require('../controllers/ai');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.me);
router.put('/auth/profile', authMiddleware, authController.updateProfile);
router.put('/auth/password', authMiddleware, authController.changePassword);
router.post('/auth/avatar', authMiddleware, authController.uploadAvatar);
router.delete('/auth/avatar', authMiddleware, authController.removeAvatar);
router.delete('/auth/account', authMiddleware, authController.deleteAccount);

// Tasks routes
router.get('/tasks', authMiddleware, tasksController.getTasks);
router.post('/tasks', authMiddleware, tasksController.createTask);
router.put('/tasks/:id', authMiddleware, tasksController.updateTask);
router.delete('/tasks/:id', authMiddleware, tasksController.deleteTask);

// Courses routes
router.get('/courses', authMiddleware, coursesController.getCourses);
router.post('/courses', authMiddleware, coursesController.createCourse);
router.put('/courses/:id', authMiddleware, coursesController.updateCourse);
router.delete('/courses/:id', authMiddleware, coursesController.deleteCourse);

// Social links routes
router.get('/socials', authMiddleware, socialsController.getSocials);
router.post('/socials', authMiddleware, socialsController.createSocial);
router.delete('/socials/:id', authMiddleware, socialsController.deleteSocial);

// Analytics routes
router.get('/analytics', authMiddleware, analyticsController.getAnalytics);

// AI Copilot routes
router.post('/ai/chat', authMiddleware, aiController.chat);

module.exports = router;
