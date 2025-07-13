import request from 'supertest';
import app from '../src/app';

describe('App Tests', () => {
    it('should respond with a 200 status for the root endpoint', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    it('should return JSON for the root endpoint', async () => {
        const response = await request(app).get('/');
        expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    // Add more tests as needed for other routes and functionalities
});