
const axios = require('axios');

async function testNotificationAll() {
    const prodUrl = 'https://manhub-checklist-app.vercel.app/api/notifications/send';
    
    // Lấy danh sách ID từ DB (đã truy vấn ở bước trước)
    const userIds = [
        '0491722d-77c4-4b44-9aff-ae2c8d29aeca',
        '2d627084-5415-4338-891d-134245d4c6fe',
        'a78dc7ab-8889-40fc-a1ce-544f44e79c47'
    ];

    console.log(`Bắn thông báo tới ${userIds.length} người dùng trên Production...`);
    
    try {
        const response = await axios.post(prodUrl, {
            userIds: userIds,
            title: '📢 Thông báo hệ thống ManHub',
            body: 'Chúng tôi vừa cập nhật tính năng thông báo mới. Chúc mọi người làm việc hiệu quả!'
        });
        console.log('Phản hồi từ Server:', response.data);
    } catch (error) {
        console.error('Lỗi khi gửi:', error.response ? error.response.data : error.message);
    }
}

testNotificationAll();
