const axios = require('axios');

const API_KEY = 'LJ4WJUR6Uh773aMTK1MkKe+7lR7jqn6YfvMihkLP7Qc=';
const TARGET_URL = 'https://app-iota-five-61.vercel.app/api/cron/send-notifications';

async function setupCronJob() {
    try {
        console.log('Đang thiết lập Cron Job trên cron-job.org...');

        const response = await axios.put('https://api.cron-job.org/jobs', {
            job: {
                url: TARGET_URL,
                enabled: true,
                saveResponses: true,
                schedule: {
                    timezone: 'Asia/Ho_Chi_Minh',
                    expiresAt: 0,
                    hours: [-1],
                    mdays: [-1],
                    minutes: [5, 15, 25, 35, 45, 55], // Chạy mỗi 10 phút (lệch 5p để khớp logic API)
                    months: [-1],
                    wdays: [-1]
                },
                title: 'ManHub Checklist Notifications'
            }
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Chúc mừng! Cron Job đã được tạo thành công.');
        console.log('Chi tiết Job ID:', response.data.jobId);
    } catch (error) {
        console.error('❌ Lỗi khi thiết lập Cron Job:', error.response ? error.response.data : error.message);
    }
}

setupCronJob();
