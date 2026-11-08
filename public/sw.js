// Nook 서비스워커: 지난 오늘 알림만 처리한다.
// 화면이나 글을 기기에 저장(캐시)하지 않는다. 그래서 fetch 처리가 없다
// (로그아웃한 뒤 내 글이 기기에 남지 않게 하는 원칙).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// 알림 받기: 발송 함수가 보낸 { title, body, url, tag }. 글 내용은 들어 있지 않다.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Nook", {
      body: data.body || "지난 오늘 쓴 글이 있어요",
      icon: "/icon/192",
      lang: "ko",
      tag: data.tag || "on-this-day", // 같은 종류의 새 알림이 오면 이전 것을 바꾼다 (지난 오늘·글쓰기는 따로)
      data: { url: data.url || "/past" },
    }),
  );
});

// 알림 누르기: 열려 있는 Nook 창이 있으면 그 창에서, 없으면 새 창으로 연다 (지난 오늘 → /past, 글쓰기 → /write)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/past", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        try {
          const moved = await client.navigate(url);
          if (moved) return moved.focus();
        } catch {
          // 이 창은 옮길 수 없다 → 다음 창 또는 새 창
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
