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
const albumMoreButton = document.querySelector("#album-more");
const accountList = document.querySelector("#account-list");
const albumViewer = document.querySelector("#album-viewer");
const albumViewerImage = document.querySelector("#album-viewer-image");
const albumCloseButton = document.querySelector(".album-viewer__close");
const albumPrevButton = document.querySelector(".album-viewer__nav--prev");
const albumNextButton = document.querySelector(".album-viewer__nav--next");
const ddayLabel = document.querySelector("#dday-label");
const welcomeMessage = document.querySelector("#welcome-message");
const shareStatus = document.querySelector("#share-status");
const shareNativeButton = document.querySelector("#share-native");
const copyLinkButton = document.querySelector("#copy-link");
const siteShell = document.querySelector(".site-shell");
const music = document.querySelector("#wedding-music");
const musicToggle = document.querySelector("#music-toggle");
const rsvpOpenButton = document.querySelector("#rsvp-open");
const rsvpModal = document.querySelector("#rsvp-modal");
const rsvpCloseButton = document.querySelector("#rsvp-close");
const rsvpForm = document.querySelector("#rsvp-form");
const rsvpStatus = document.querySelector("#rsvp-status");
const venueMapFrame = document.querySelector("#venue-map-frame");
const venueMapHost = document.querySelector("#venue-map");
let currentAlbumIndex = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const initVenueMap = () => {
  if (!venueMapFrame || !venueMapHost) return;

  const mapStatus = venueMapFrame.querySelector(".venue-map-status");
  const showMapError = (message) => {
    venueMapFrame.classList.remove("is-map-ready");
    venueMapFrame.classList.add("is-map-error");
    if (mapStatus) mapStatus.textContent = message;
  };

  const clientId = String(config.naverMapClientId || "").trim();
  if (!clientId || clientId.includes("YOUR_")) {
    showMapError("네이버 지도 Client ID 설정을 확인해 주세요.");
    return;
  }

  const renderMap = () => {
    if (!window.naver?.maps?.Map) {
      showMapError("네이버 지도 SDK를 불러오지 못했습니다.");
      return;
    }

    const lat = Number(siteData.venue?.lat);
    const lng = Number(siteData.venue?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      showMapError("예식장 지도 좌표를 확인해 주세요.");
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);
    const map = new window.naver.maps.Map(venueMapHost, {
      center: position,
      zoom: 16,
      minZoom: 12,
      maxZoom: 19,
      scrollWheel: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.RIGHT_CENTER,
      },
    });

    const marker = new window.naver.maps.Marker({ map, position });
    const infoWindow = new window.naver.maps.InfoWindow({
      content: '<div class="venue-map-label"><strong>엔팰리스웨딩컨벤션</strong><span>블리스홀 · 오전 11시</span></div>',
      borderWidth: 0,
      backgroundColor: "transparent",
      anchorSize: new window.naver.maps.Size(0, 0),
      pixelOffset: new window.naver.maps.Point(0, -12),
    });
    infoWindow.open(map, marker);
    venueMapFrame.classList.remove("is-map-error");
    venueMapFrame.classList.add("is-map-ready");

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        window.naver.maps.Event.trigger(map, "resize");
        map.setCenter(position);
      }).observe(venueMapHost);
    }
  };

  if (window.naver?.maps?.Map) {
    renderMap();
    return;
  }

  window.navermap_authFailure = () => {
    showMapError("네이버 지도 인증에 실패했습니다. Client ID와 Web 서비스 URL을 확인해 주세요.");
  };

  const script = document.createElement("script");
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
  script.addEventListener("load", renderMap, { once: true });
  script.addEventListener("error", () => showMapError("네이버 지도 SDK 연결에 실패했습니다."), { once: true });
  document.head.appendChild(script);
};

initVenueMap();

const setMusicState = (playing) => {
  musicToggle.classList.toggle("is-paused", !playing);
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.setAttribute("aria-label", playing ? "배경 음악 끄기" : "배경 음악 재생하기");
};

const tryPlayMusic = async () => {
  try {
    music.volume = 0.24;
    await music.play();
    setMusicState(true);
    return true;
  } catch {
    setMusicState(false);
    return false;
  }
};

musicToggle.addEventListener("pointerdown", (event) => event.stopPropagation());
musicToggle.addEventListener("click", async () => {
  if (music.paused) await tryPlayMusic();
  else { music.pause(); setMusicState(false); }
});

tryPlayMusic().then((started) => {
  if (started) return;
  const startOnFirstGesture = () => { tryPlayMusic(); };
  document.addEventListener("pointerdown", startOnFirstGesture, { once: true });
  document.addEventListener("keydown", startOnFirstGesture, { once: true });
});

const openRsvpModal = () => {
  rsvpModal.hidden = false;
  document.body.classList.add("is-viewing-rsvp");
  rsvpStatus.textContent = "";
  requestAnimationFrame(() => rsvpModal.querySelector("input")?.focus());
};

const closeRsvpModal = () => {
  rsvpModal.hidden = true;
  document.body.classList.remove("is-viewing-rsvp");
  rsvpOpenButton.focus();
};

rsvpOpenButton.addEventListener("click", openRsvpModal);
rsvpCloseButton.addEventListener("click", closeRsvpModal);
rsvpModal.addEventListener("click", (event) => {
  if (event.target === rsvpModal) closeRsvpModal();
});

rsvpForm.elements.phone_last4.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
});

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    rsvpStatus.textContent = "Supabase 설정 후 참석 정보를 저장할 수 있습니다.";
    return;
  }

  const submitButton = rsvpForm.querySelector('[type="submit"]');
  const formData = new FormData(rsvpForm);
  submitButton.disabled = true;
  rsvpStatus.textContent = "참석 의사를 저장하고 있습니다...";

  const { error } = await client.rpc("submit_rsvp_response", {
    p_side: formData.get("side"),
    p_attendance: formData.get("attendance"),
    p_name: String(formData.get("name") || "").trim(),
    p_phone_last4: String(formData.get("phone_last4") || "").trim(),
    p_party_size: Number(formData.get("party_size")),
    p_note: String(formData.get("note") || "").trim(),
  });

  submitButton.disabled = false;

  if (error) {
    rsvpStatus.textContent = "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return;
  }

  rsvpForm.reset();
  rsvpStatus.textContent = "참석 의사가 소중히 전달되었습니다.";
  rsvpOpenButton.textContent = "참석 의사 전달 완료";
  setTimeout(closeRsvpModal, 1200);
});

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

  albumGrid.classList.remove("is-expanded");
  albumMoreButton.hidden = images.length <= 9;
  albumMoreButton.setAttribute("aria-expanded", "false");
  albumMoreButton.setAttribute("aria-label", "사진 더보기");

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
        <button type="button" class="album__item${index >= 9 ? " album__item--extra" : ""}" data-album-index="${index}">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
        </button>
      `;
    })
    .join("");

  albumGrid.querySelectorAll("[data-album-index]").forEach((button) => {
    button.addEventListener("click", () => {
      showAlbumImage(Number(button.dataset.albumIndex));
    });
  });
};

albumMoreButton.addEventListener("click", () => {
  const expanded = albumGrid.classList.toggle("is-expanded");
  albumMoreButton.setAttribute("aria-expanded", String(expanded));
  albumMoreButton.setAttribute("aria-label", expanded ? "사진 접기" : "사진 더보기");

  if (!expanded) {
    document.querySelector(".album").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

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
  albumViewer.hidden = false;
  document.body.classList.add("is-viewing-album");
};

const closeAlbum = () => {
  albumViewer.hidden = true;
  albumViewerImage.src = "";
  document.body.classList.remove("is-viewing-album");
};

albumCloseButton.addEventListener("click", closeAlbum);
albumPrevButton.addEventListener("click", () => showAlbumImage(currentAlbumIndex - 1));
albumNextButton.addEventListener("click", () => showAlbumImage(currentAlbumIndex + 1));
albumViewer.addEventListener("click", (event) => {
  if (event.target === albumViewer) closeAlbum();
});
document.addEventListener("keydown", (event) => {
  if (!rsvpModal.hidden && event.key === "Escape") {
    closeRsvpModal();
    return;
  }
  if (albumViewer.hidden) return;
  if (event.key === "Escape") closeAlbum();
  if (event.key === "ArrowLeft") showAlbumImage(currentAlbumIndex - 1);
  if (event.key === "ArrowRight") showAlbumImage(currentAlbumIndex + 1);
});

const revealSections = () => {
  const sections = document.querySelectorAll(".section");

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 },
  );

  sections.forEach((section) => observer.observe(section));
};

const renderPetals = () => {
  const petalConfig = siteData.petals || {};
  if (petalConfig.enabled === false || !siteShell) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const createPetal = (className = "petal") => {
    const petal = document.createElement("span");
    const size = 9 + Math.random() * 8;
    const fall = 11 + Math.random() * 9;
    const sway = 3.6 + Math.random() * 2.8;
    const drift = (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 38);

    petal.className = className;
    petal.style.setProperty("--petal-left", `${Math.random() * 100}%`);
    petal.style.setProperty("--petal-size", `${size}px`);
    petal.style.setProperty("--petal-fall", `${fall}s`);
    petal.style.setProperty("--petal-sway", `${sway}s`);
    petal.style.setProperty("--petal-delay", `${Math.random() * -fall}s`);
    petal.style.setProperty("--petal-sway-delay", `${Math.random() * -sway}s`);
    petal.style.setProperty("--petal-opacity", `${0.16 + Math.random() * 0.16}`);
    petal.style.setProperty("--petal-spin", `${Math.random() * 360}deg`);
    petal.style.setProperty("--petal-drift", `${drift}px`);
    return petal;
  };

  const createPetalLayer = (target, className, count) => {
    if (!target) return;

    const layer = document.createElement("div");
    layer.className = `petal-layer ${className}`;
    layer.setAttribute("aria-hidden", "true");

    for (let index = 0; index < count; index += 1) {
      layer.append(createPetal());
    }

    target.prepend(layer);
  };

  createPetalLayer(
    document.querySelector(".hero"),
    "petal-layer--hero",
    clamp(Number(petalConfig.heroCount) || 8, 0, 16),
  );

  if (!prefersReducedMotion) {
    const sectionCount = clamp(Number(petalConfig.sectionCount) || 3, 0, 10);
    createPetalLayer(document.querySelector(".intro"), "petal-layer--section", sectionCount);
  }
};

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
        <details class="account-card">
          <summary><span>${escapeHtml(account.side)}</span><i aria-hidden="true"></i></summary>
          <div class="account-card__body">
            <div>
              <strong>${escapeHtml(account.bank)} ${escapeHtml(account.number)}</strong>
              <p>예금주 ${escapeHtml(account.holder)} · ${escapeHtml(account.name)}</p>
            </div>
            <button type="button" data-copy-account="${index}">복사</button>
          </div>
        </details>
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

renderDday();
renderAlbum();
renderAccounts();
renderPetals();
revealSections();
loadMessages();
