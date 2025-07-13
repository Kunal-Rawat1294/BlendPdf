import express from 'express';
import { setupRoutes } from './routes';
import { setupMiddlewares } from './middlewares';
import { config } from './config';

const app = express();

// Middleware setup
setupMiddlewares(app);

// Route setup
setupRoutes(app);

// Start the server
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;