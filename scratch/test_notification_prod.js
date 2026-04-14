
const axios = require('axios');

async function testNotificationProduction() {
    const prodUrl = 'https://manhub-checklist-app.vercel.app/api/notifications/send';
    console.log(`Testing notifications on: ${prodUrl}`);
    
    try {
        const response = await axios.post(prodUrl, {
            userIds: ['0491722d-77c4-4b44-9aff-ae2c8d29aeca'], // ID của bạn (Hoàng Thiện Tâm)
            title: '🚀 Production Live Test',
            body: 'Thông báo Push đa kênh từ ManHub Production.'
        });
        console.log('Production Response:', response.data);
    } catch (error) {
        console.error('Production Error:', error.response ? error.response.data : error.message);
    }
}

testNotificationProduction();
