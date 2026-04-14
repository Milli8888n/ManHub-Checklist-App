
const axios = require('axios');

async function testAll() {
    const prodUrl = 'https://manhub-checklist-app.vercel.app/api/notifications/send';
    
    // Gửi cho Admin
    try {
        const resAdmin = await axios.post(prodUrl, {
            role: 'admin',
            title: 'Admin Verification 👑',
            body: 'Kiểm tra thông báo quyền Admin'
        });
        console.log('Admin res:', resAdmin.data);
    } catch (e) { console.error('Admin error'); }

    // Gửi cho Staff
    try {
        const resStaff = await axios.post(prodUrl, {
            role: 'staff',
            title: 'Staff Verification 👷',
            body: 'Kiểm tra thông báo quyền Nhân viên'
        });
        console.log('Staff res:', resStaff.data);
    } catch (e) { console.error('Staff error'); }
}

testAll();
