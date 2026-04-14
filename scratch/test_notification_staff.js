
const axios = require('axios');

async function testNotificationStaff() {
    const prodUrl = 'https://manhub-checklist-app.vercel.app/api/notifications/send';
    console.log(`Sending notification to STAFF on: ${prodUrl}`);
    
    try {
        const response = await axios.post(prodUrl, {
            role: 'staff',
            title: 'Staff Test Notification 👷',
            body: 'Thông báo dành riêng cho nhân viên đang hoạt động!'
        });
        console.log('Production Response (Staff):', response.data);
    } catch (error) {
        console.error('Production Error:', error.response ? error.response.data : error.message);
    }
}

testNotificationStaff();
