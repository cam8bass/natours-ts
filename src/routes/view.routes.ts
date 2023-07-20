import { Router } from 'express';
import * as viewController from './../controllers/view.controller';
import * as authController from './../controllers/auth.controller';
const router = Router();

router.get('/me', authController.protect, viewController.getAccount);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);
router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);

router.get('/tour/:slug', viewController.getTour);

router.get('/login', viewController.getLoginForm);

export default router;
