const CACHE_VERSION = 'v1';
const CACHE_LIST = [
    '/toolbox/',
    '/toolbox/index.html',
];

this.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(function (cache) {
            return cache.addAll(CACHE_LIST);
        })
    );
});

this.addEventListener('fetch', function (event) {
    event.respondWith(caches.match(event.request).then(response => {
        return response || fetch(event.request);
    }).catch(function () {
        return fetch(event.request);
    }).then(function (response) {
        caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, response);
        });
        return response.clone();
    }).catch(function (e) {
        return console.error(e);
    }));
});
