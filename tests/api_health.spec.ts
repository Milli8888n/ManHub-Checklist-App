import { test, expect } from '@playwright/test';

test.describe('System API Healthcheck', () => {

    test('Daily Task Generation API should return 200 OK', async ({ request }) => {
        const response = await request.get('/api/cron/generate-daily-tasks');

        // Expect 200 OK
        expect(response.status()).toBe(200);

        // Expect JSON body to contain success or message
        const body = await response.json();
        console.log('Task Gen API Response:', body);

        // Flexible check: success:true OR message (if tasks already exist)
        expect(body.success === true || body.message).toBeTruthy();
    });

    test('Notification Cron API should return 200 OK', async ({ request }) => {
        const response = await request.get('/api/cron/send-notifications');

        // Expect 200 OK
        expect(response.status()).toBe(200);

        const body = await response.json();
        console.log('Notification API Response:', body);

        expect(body.success).toBe(true);
    });

});
