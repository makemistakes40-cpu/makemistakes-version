import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// Platform Analytics
router.get('/admin/analytics', authenticate as any, requirePermission('MANAGE_ANALYTICS') as any, adminController.getAnalytics);

// Admin Action Log Audits
router.get('/admin/audit-logs', authenticate as any, requirePermission('MANAGE_ROLES') as any, adminController.getAuditLogs);

// User Profile Overrides
router.get('/admin/users', authenticate as any, requirePermission('MANAGE_USERS') as any, adminController.getUsers);
router.post('/admin/users/:id/suspend', authenticate as any, requirePermission('MANAGE_USERS') as any, adminController.suspendUser);
router.post('/admin/users/:id/role', authenticate as any, requirePermission('MANAGE_ROLES') as any, adminController.assignRole);
router.post('/admin/users/:id/reset-password', authenticate as any, requirePermission('MANAGE_USERS') as any, adminController.resetPassword);

// Course Lifecycle Overrides
router.get('/admin/courses', authenticate as any, requirePermission('MANAGE_COURSES') as any, adminController.getCourses);
router.post('/admin/courses', authenticate as any, requirePermission('MANAGE_COURSES') as any, adminController.createCourse);
router.put('/admin/courses/:id', authenticate as any, requirePermission('MANAGE_COURSES') as any, adminController.updateCourse);
router.delete('/admin/courses/:id', authenticate as any, requirePermission('MANAGE_COURSES') as any, adminController.deleteCourse);

export default router;
