// Service Worker for Pitch Trainer
const CACHE = 'pitch-trainer-v12';
const ASSETS = ['./', './manifest.json', './icon.svg'];

// インストール: 即座に新SWを有効化
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを削除 + 全クライアントを即座に制御
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// フェッチ戦略:
//   HTML → ネットワーク優先（オフライン時のみキャッシュ）
//   その他 → Stale-While-Revalidate（キャッシュ返しつつ裏で更新）
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML (ナビゲーション) → Network First
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('./')))
    );
    return;
  }

  // その他アセット → Stale-While-Revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok && url.protocol.startsWith('http')) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// メッセージ: 強制更新要求
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
