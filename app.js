const config = window.WEDDING_CONFIG || {};
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
        message: "Supabase URL과 anon key를 config.js에 넣으면 실제 방명록으로 연결됩니다.",
        created_at: new Date().toISOString(),
      },
    ]);
    setStatus("Supabase 설정 전이라 예시 메시지를 보여주고 있어요.");
    return;
  }

  const { data, error } = await client
    .from("guestbook")
    .select("name, attendance, message, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    setStatus("방명록을 불러오지 못했습니다. Supabase 정책을 확인해 주세요.");
    return;
  }

  renderMessages(data || []);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    setStatus("먼저 config.js에 Supabase 설정을 입력해 주세요.");
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  setStatus("저장 중입니다...");

  const payload = {
    name: nameInput.value.trim(),
    attendance: attendanceInput.value,
    message: messageInput.value.trim(),
  };

  const { error } = await client.from("guestbook").insert(payload);

  button.disabled = false;

  if (error) {
    setStatus("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  form.reset();
  setStatus("소중한 마음이 저장되었습니다.");
  await loadMessages();
});

loadMessages();
