
const axios = require('axios');

async function testNotificationProduction() {
    const prodUrl = 'https://manhub-checklist-app.vercel.app/api/notifications/send';
    console.log(`Testing notifications on: ${prodUrl}`);
    
    try {
        const response = await axios.post(prodUrl, {
            role: 'admin',
            title: 'Production Test Notification 🚢',
            body: 'Thông báo từ hệ thống Production đang hoạt động!'
        });
        console.log('Production Response:', response.data);
    } catch (error) {
        console.error('Production Error:', error.response ? error.response.data : error.message);
    }
}

testNotificationProduction();
