
const axios = require('axios');

async function testNotification() {
    try {
        const response = await axios.post('http://localhost:3000/api/notifications/send', {
            role: 'admin',
            title: 'Test Notification 🚀',
            body: 'Hệ thống thông báo đang hoạt động ổn định!'
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testNotification();
