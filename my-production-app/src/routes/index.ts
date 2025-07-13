import { Router } from 'express';
import { YourController } from '../controllers/index';

const router = Router();

router.get('/your-route', YourController.yourMethod);
router.post('/your-route', YourController.yourMethod);

export default (app) => {
    app.use('/api', router);
};