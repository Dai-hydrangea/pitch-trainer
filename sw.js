// Service Worker for 音程練習アプリ
const CACHE = 'pitch-trainer-v30';
const ASSETS = ['./', './manifest.json', './icon.svg'];

// インストール: キャッシュに保存
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ: Network First（ネットワーク優先、失敗時キャッシュ）
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(res => {
      // 成功したらキャッシュを更新
      if (res.ok || res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./')))
  );
});
