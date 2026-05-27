const config = window.WEDDING_CONFIG || {};
const siteData = window.WEDDING_SITE_DATA || {};
const isConfigured =
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes("YOUR_") &&
  !config.supabaseAnonKey.includes("YOUR_");

const client = isConfigured
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const form = document.querySelector("#guestbook-form");
const statusEl = document.querySelector("#form-status");
const listEl = document.querySelector("#guestbook-list");
const nameInput = document.querySelector("#guest-name");
const attendanceInput = document.querySelector("#guest-attendance");
const messageInput = document.querySelector("#guest-message");
const albumGrid = document.querySelector("#album-grid");
const accountList = document.querySelector("#account-list");
const albumViewer = document.querySelector("#album-viewer");
const albumViewerImage = document.querySelector("#album-viewer-image");
const albumViewerCaption = document.querySelector("#album-viewer-caption");
const albumCloseButton = document.querySelector(".album-viewer__close");
const albumPrevButton = document.querySelector(".album-viewer__nav--prev");
const albumNextButton = document.querySelector(".album-viewer__nav--next");
const ddayLabel = document.querySelector("#dday-label");
const welcomeMessage = document.querySelector("#welcome-message");
const shareStatus = document.querySelector("#share-status");
const shareKakaoButton = document.querySelector("#share-kakao");
const shareNativeButton = document.querySelector("#share-native");
const copyLinkButton = document.querySelector("#copy-link");
let currentAlbumIndex = 0;
let touchStartX = 0;

const getDeviceToken = () => {
  const key = "wedding_guestbook_device_token";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const token =
    crypto.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, token);
  return token;
};

const setStatus = (message) => {
  statusEl.textContent = message;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getShareUrl = () => window.location.href.split("#")[0];

const setShareStatus = (message) => {
  shareStatus.textContent = message;
};

const renderDday = () => {
  const target = new Date(siteData.weddingDate);
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays)) {
    ddayLabel.textContent = "D-Day";
  } else if (diffDays > 0) {
    ddayLabel.textContent = `D-${diffDays}`;
  } else if (diffDays === 0) {
    ddayLabel.textContent = "D-Day";
  } else {
    ddayLabel.textContent = `D+${Math.abs(diffDays)}`;
  }

  const messages = Array.isArray(siteData.welcomeMessages) ? siteData.welcomeMessages : [];
  welcomeMessage.textContent = messages.length
    ? messages[Math.floor(Math.random() * messages.length)]
    : "소중한 발걸음을 기다립니다.";
};

const renderAlbum = () => {
  const images = Array.isArray(siteData.albumImages) ? siteData.albumImages : [];

  if (!images.length) {
    albumGrid.innerHTML = `
      <div class="album__empty">
        <strong>사진 준비 중</strong>
        <p>나중에 사진 URL을 추가하면 이곳에 앨범이 표시됩니다.</p>
      </div>
    `;
    return;
  }

  albumGrid.innerHTML = images
    .map((item, index) => {
      const src = typeof item === "string" ? item : item.src;
      const alt = typeof item === "string" ? "웨딩 앨범 사진" : item.alt || "웨딩 앨범 사진";
      return `
        <button type="button" class="album__item" data-album-index="${index}">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
        </button>
      `;
    })
    .join("");
};

const getAlbumItem = (index) => {
  const images = Array.isArray(siteData.albumImages) ? siteData.albumImages : [];
  const item = images[index];
  if (!item) return null;
  return {
    src: typeof item === "string" ? item : item.src,
    alt: typeof item === "string" ? "웨딩 앨범 사진" : item.alt || "웨딩 앨범 사진",
  };
};

const showAlbumImage = (index) => {
  const images = Array.isArray(siteData.albumImages) ? siteData.albumImages : [];
  if (!images.length) return;

  currentAlbumIndex = (index + images.length) % images.length;
  const item = getAlbumItem(currentAlbumIndex);
  albumViewerImage.src = item.src;
  albumViewerImage.alt = item.alt;
  albumViewerCaption.textContent = item.alt;
  albumViewer.hidden = false;
  document.body.classList.add("is-viewing-album");
};

const closeAlbum = () => {
  albumViewer.hidden = true;
  albumViewerImage.src = "";
  document.body.classList.remove("is-viewing-album");
};

albumGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-album-index]");
  if (!button) return;
  showAlbumImage(Number(button.dataset.albumIndex));
});

albumCloseButton.addEventListener("click", closeAlbum);
albumPrevButton.addEventListener("click", () => showAlbumImage(currentAlbumIndex - 1));
albumNextButton.addEventListener("click", () => showAlbumImage(currentAlbumIndex + 1));
albumViewer.addEventListener("click", (event) => {
  if (event.target === albumViewer) closeAlbum();
});
albumViewer.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
});
albumViewer.addEventListener("touchend", (event) => {
  const touchEndX = event.changedTouches[0].clientX;
  const distance = touchEndX - touchStartX;
  if (Math.abs(distance) < 40) return;
  showAlbumImage(currentAlbumIndex + (distance < 0 ? 1 : -1));
});
document.addEventListener("keydown", (event) => {
  if (albumViewer.hidden) return;
  if (event.key === "Escape") closeAlbum();
  if (event.key === "ArrowLeft") showAlbumImage(currentAlbumIndex - 1);
  if (event.key === "ArrowRight") showAlbumImage(currentAlbumIndex + 1);
});

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

const renderAccounts = () => {
  const accounts = Array.isArray(siteData.accounts) ? siteData.accounts : [];

  accountList.innerHTML = accounts
    .map(
      (account, index) => `
        <article class="account-card">
          <div>
            <span>${escapeHtml(account.side)}</span>
            <strong>${escapeHtml(account.bank)} ${escapeHtml(account.number)}</strong>
            <p>${escapeHtml(account.holder)} · ${escapeHtml(account.name)}</p>
          </div>
          <button type="button" data-copy-account="${index}">복사</button>
          <div class="account-card__pay">
            <button type="button" data-pay-account="${index}" data-pay-type="kakaoPayUrl">카카오페이</button>
            <button type="button" data-pay-account="${index}" data-pay-type="tossUrl">토스</button>
          </div>
        </article>
      `,
    )
    .join("");
};

accountList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-account]");
  if (!button) return;

  const account = siteData.accounts[Number(button.dataset.copyAccount)];
  const copyValue = `${account.bank} ${account.number} ${account.holder}`;

  try {
    await copyText(copyValue);
    button.textContent = "복사됨";
    setTimeout(() => {
      button.textContent = "복사";
    }, 1400);
  } catch {
    button.textContent = "실패";
    setTimeout(() => {
      button.textContent = "복사";
    }, 1400);
  }
});

accountList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-pay-account]");
  if (!button) return;

  const account = siteData.accounts[Number(button.dataset.payAccount)];
  const url = account[button.dataset.payType];
  const copyValue = `${account.bank} ${account.number} ${account.holder}`;

  if (url) {
    window.location.href = url;
    return;
  }

  await copyText(copyValue);
  button.textContent = "계좌 복사됨";
  setTimeout(() => {
    button.textContent = button.dataset.payType === "kakaoPayUrl" ? "카카오페이" : "토스";
  }, 1400);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-navi]");
  if (!button) return;

  const venue = siteData.venue || {};
  const lat = venue.latitude;
  const lng = venue.longitude;
  const name = encodeURIComponent(venue.name || "예식장");
  const fallback = venue.kakaoMapUrl || venue.naverMapUrl || getShareUrl();

  if (!lat || !lng) {
    window.location.href = fallback;
    return;
  }

  const appUrl =
    button.dataset.navi === "kakao"
      ? `kakaonavi://navigate?name=${name}&x=${lng}&y=${lat}&coord_type=wgs84`
      : `tmap://route?goalname=${name}&goalx=${lng}&goaly=${lat}`;

  window.location.href = appUrl;
  setTimeout(() => {
    window.location.href = fallback;
  }, 900);
});

const renderMessages = (messages) => {
  if (!messages.length) {
    listEl.innerHTML = '<article class="message"><p>아직 남겨진 방명록이 없습니다.</p></article>';
    return;
  }

  listEl.innerHTML = messages
    .map(
      (item) => `
        <article class="message">
          <div class="message__meta">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.attendance)} · ${formatDate(item.created_at)}</span>
          </div>
          <p>${escapeHtml(item.message)}</p>
          ${
            item.can_edit
              ? `
                <div class="message__actions">
                  <button type="button" data-edit-open="${item.id}">수정/삭제</button>
                </div>
                <form class="message-editor" data-editor="${item.id}" hidden>
                  <label>
                    이름
                    <input data-edit-field="name" maxlength="20" value="${escapeHtml(item.name)}" required />
                  </label>
                  <label>
                    참석 여부
                    <select data-field="attendance" data-edit-field="attendance">
                      <option value="참석 예정" ${item.attendance === "참석 예정" ? "selected" : ""}>참석 예정</option>
                      <option value="불참" ${item.attendance === "불참" ? "selected" : ""}>불참</option>
                      <option value="미정" ${item.attendance === "미정" ? "selected" : ""}>미정</option>
                    </select>
                  </label>
                  <label>
                    메시지
                    <textarea data-edit-field="message" maxlength="300" rows="3" required>${escapeHtml(item.message)}</textarea>
                  </label>
                  <div class="message-editor__actions">
                    <button type="submit">저장</button>
                    <button type="button" data-delete-entry="${item.id}" class="danger-button">삭제</button>
                  </div>
                </form>
              `
              : ""
          }
        </article>
      `,
    )
    .join("");
};

const loadMessages = async () => {
  if (!client) {
    renderMessages([
      {
        name: "예시",
        attendance: "참석 예정",
        message: "Supabase URL과 anon key를 설정하면 실제 방명록으로 연결됩니다.",
        created_at: new Date().toISOString(),
      },
    ]);
    setStatus("Supabase 설정 전이라 예시 메시지를 보여주고 있어요.");
    return;
  }

  const { data, error } = await client.rpc("list_guestbook_entries", {
    p_owner_token: getDeviceToken(),
  });

  if (error) {
    setStatus("방명록을 불러오지 못했습니다. Supabase SQL을 다시 실행해 주세요.");
    return;
  }

  renderMessages(data || []);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    setStatus("먼저 Supabase 설정을 입력해 주세요.");
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  setStatus("저장 중입니다...");

  const payload = {
    p_name: nameInput.value.trim(),
    p_attendance: attendanceInput.value,
    p_message: messageInput.value.trim(),
    p_owner_token: getDeviceToken(),
  };

  const { error } = await client.rpc("create_guestbook_entry", payload);

  button.disabled = false;

  if (error) {
    setStatus("저장하지 못했습니다. Supabase SQL을 다시 실행한 뒤 새로고침해 주세요.");
    return;
  }

  form.reset();
  setStatus("소중한 마음이 저장되었습니다.");
  await loadMessages();
});

listEl.addEventListener("click", async (event) => {
  if (!client) {
    setStatus("먼저 Supabase 설정을 입력해 주세요.");
    return;
  }

  const openButton = event.target.closest("[data-edit-open]");
  if (openButton) {
    const editor = listEl.querySelector(`[data-editor="${openButton.dataset.editOpen}"]`);
    editor.hidden = !editor.hidden;
    return;
  }

  const deleteButton = event.target.closest("[data-delete-entry]");
  if (!deleteButton) return;

  const { data, error } = await client.rpc("delete_guestbook_entry", {
    p_id: Number(deleteButton.dataset.deleteEntry),
    p_owner_token: getDeviceToken(),
  });

  if (error || !data) {
    setStatus("이 브라우저에서 작성한 글만 삭제할 수 있습니다.");
    return;
  }

  setStatus("방명록을 삭제했습니다.");
  await loadMessages();
});

listEl.addEventListener("submit", async (event) => {
  const editor = event.target.closest(".message-editor");
  if (!editor) return;
  event.preventDefault();

  if (!client) {
    setStatus("먼저 Supabase 설정을 입력해 주세요.");
    return;
  }

  const id = Number(editor.dataset.editor);
  const payload = {
    p_id: id,
    p_name: editor.querySelector('[data-edit-field="name"]').value.trim(),
    p_attendance: editor.querySelector('[data-edit-field="attendance"]').value,
    p_message: editor.querySelector('[data-edit-field="message"]').value.trim(),
    p_owner_token: getDeviceToken(),
  };

  const { data, error } = await client.rpc("update_guestbook_entry", payload);

  if (error || !data) {
    setStatus("이 브라우저에서 작성한 글만 수정할 수 있습니다.");
    return;
  }

  setStatus("방명록을 수정했습니다.");
  await loadMessages();
});

const sharePayload = () => ({
  title: siteData.shareTitle || "우리 결혼합니다",
  text: siteData.shareDescription || "소중한 분들을 초대합니다.",
  url: getShareUrl(),
});

shareNativeButton.addEventListener("click", async () => {
  const payload = sharePayload();

  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await copyText(payload.url);
    setShareStatus("공유 기능을 지원하지 않아 링크를 복사했습니다.");
  } catch {
    setShareStatus("공유를 취소했습니다.");
  }
});

copyLinkButton.addEventListener("click", async () => {
  await copyText(getShareUrl());
  setShareStatus("초대장 링크를 복사했습니다.");
});

shareKakaoButton.addEventListener("click", async () => {
  const payload = sharePayload();

  if (!config.kakaoJsKey || !window.Kakao?.Share) {
    await copyText(payload.url);
    setShareStatus("카카오 JavaScript 키가 없어 링크를 복사했습니다.");
    return;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(config.kakaoJsKey);
  }

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: payload.title,
      description: payload.text,
      imageUrl: siteData.shareImage,
      link: {
        mobileWebUrl: payload.url,
        webUrl: payload.url,
      },
    },
    buttons: [
      {
        title: "초대장 보기",
        link: {
          mobileWebUrl: payload.url,
          webUrl: payload.url,
        },
      },
    ],
  });
});

renderDday();
renderAlbum();
renderAccounts();
loadMessages();
