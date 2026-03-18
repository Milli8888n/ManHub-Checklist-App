self.addEventListener('push', function (event) {
    console.log('Push received:', event.data ? event.data.text() : 'No data');
    if (event.data) {
        const data = event.data.json();
        console.log('Push data:', data);
        const options = {
            body: data.body,
            icon: '/icon.png',
            badge: '/icon.png',
            vibrate: [200, 100, 200],
            tag: 'manhub-notification', // Overwrite old if same tag
            renotify: true, // Vibrate even if old one visible
            data: {
                url: data.data?.url || '/',
                dateOfArrival: Date.now(),
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Xem ngay',
                }
            ]
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a tab open with this URL
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
