import express from 'express';
import { config } from './config';
import { setupRoutes } from './routes';

const app = express();
const PORT = config.port || 3000;

// Middleware setup can be done here
app.use(express.json());

// Setup routes
setupRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});