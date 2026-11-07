/* TrekBook — sw.js : เก็บไฟล์หน้าแอปไว้ในเครื่อง ให้เปิดแอปได้เร็ว และขึ้นหน้า "ไม่มีอินเทอร์เน็ต" ได้แม้ออฟไลน์
 * ข้อมูลทริป/การจอง (เว็บแอป Apps Script) ไม่ถูกเก็บ — โหลดใหม่จากเซิร์ฟเวอร์ทุกครั้ง
 * แก้ไฟล์หน้าแอปเมื่อไหร่ เปิดแอปตอนมีเน็ตก็ได้ไฟล์ใหม่ทันที (ดึงจากเน็ตก่อน ไม่มีเน็ตค่อยใช้ของในเครื่อง) */
var CACHE = 'trekbook-app-v1';
var FILES = ['./', './index.html', './config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // เว็บแอป Apps Script / Google ไม่ผ่านตัวนี้
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && !url.search) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    });
  }));
});
