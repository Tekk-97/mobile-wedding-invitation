const config = window.WEDDING_CONFIG || {};
const isConfigured =
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes("YOUR_") &&
  !config.supabaseAnonKey.includes("YOUR_");

const client = isConfigured
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const loginForm = document.querySelector("#login-form");
const adminPanel = document.querySelector("#admin-panel");
const adminList = document.querySelector("#admin-list");
const adminRsvpList = document.querySelector("#admin-rsvp-list");
const adminRsvpCount = document.querySelector("#admin-rsvp-count");
const statusEl = document.querySelector("#admin-status");
const logoutButton = document.querySelector("#logout-button");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const setStatus = (message) => {
  statusEl.textContent = message;
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const renderRsvpRows = (rows) => {
  adminRsvpCount.textContent = `총 ${rows.length}건`;

  if (!rows.length) {
    adminRsvpList.innerHTML = '<article class="message"><p>아직 전달된 참석 의사가 없습니다.</p></article>';
    return;
  }

  adminRsvpList.innerHTML = rows
    .map(
      (row) => `
        <article class="admin-card admin-rsvp-card" data-rsvp-id="${row.id}">
          <div class="admin-rsvp-card__head">
            <strong>${escapeHtml(row.name)}</strong>
            <span>${escapeHtml(row.side)}측 · ${escapeHtml(row.attendance)}</span>
          </div>
          <p>연락처 뒤 4자리 <strong>${escapeHtml(row.phone_last4)}</strong> · ${row.party_size >= 5 ? "5명 이상" : `${row.party_size}명`}</p>
          ${row.note ? `<p class="admin-rsvp-card__note">${escapeHtml(row.note)}</p>` : ""}
          <div class="admin-rsvp-card__foot">
            <time>${formatDate(row.created_at)}</time>
            <button type="button" data-action="delete-rsvp" class="danger-button">삭제</button>
          </div>
        </article>
      `,
    )
    .join("");
};

const renderRows = (rows) => {
  if (!rows.length) {
    adminList.innerHTML = '<article class="message"><p>관리할 방명록이 없습니다.</p></article>';
    return;
  }

  adminList.innerHTML = rows
    .map(
      (row) => `
        <article class="admin-card" data-id="${row.id}">
          <label>
            이름
            <input data-field="name" maxlength="20" value="${escapeHtml(row.name)}" />
          </label>
          <label>
            참석 여부
            <select data-field="attendance">
              <option value="참석 예정" ${row.attendance === "참석 예정" ? "selected" : ""}>참석 예정</option>
              <option value="불참" ${row.attendance === "불참" ? "selected" : ""}>불참</option>
              <option value="미정" ${row.attendance === "미정" ? "selected" : ""}>미정</option>
            </select>
          </label>
          <label>
            메시지
            <textarea data-field="message" maxlength="300" rows="3">${escapeHtml(row.message)}</textarea>
          </label>
          <div class="admin-actions">
            <button type="button" data-action="save">저장</button>
            <button type="button" data-action="delete" class="danger-button">삭제</button>
          </div>
        </article>
      `,
    )
    .join("");
};

const loadRows = async () => {
  const [guestbookResult, rsvpResult] = await Promise.all([
    client
      .from("guestbook")
      .select("id, name, attendance, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("rsvp_responses")
      .select("id, side, attendance, name, phone_last4, party_size, note, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (guestbookResult.error || rsvpResult.error) {
    setStatus("관리자 권한이 없거나 응답 정보를 불러오지 못했습니다.");
    return;
  }

  renderRsvpRows(rsvpResult.data || []);
  renderRows(guestbookResult.data || []);
  setStatus("");
};

const showPanel = async () => {
  loginForm.hidden = true;
  adminPanel.hidden = false;
  await loadRows();
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    setStatus("Supabase 설정이 필요합니다.");
    return;
  }

  const email = document.querySelector("#admin-email").value.trim();
  const password = document.querySelector("#admin-password").value;
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus("로그인하지 못했습니다. 계정 정보를 확인해 주세요.");
    return;
  }

  await showPanel();
});

adminList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const card = button.closest("[data-id]");
  const id = card.dataset.id;

  if (button.dataset.action === "delete") {
    const { data, error } = await client.rpc("admin_delete_guestbook_entry", {
      p_id: Number(id),
    });
    setStatus(error || !data ? "삭제하지 못했습니다. 관리자 권한을 확인해 주세요." : "삭제했습니다.");
    await loadRows();
    return;
  }

  const payload = {
    p_id: Number(id),
    p_name: card.querySelector('[data-field="name"]').value.trim(),
    p_attendance: card.querySelector('[data-field="attendance"]').value,
    p_message: card.querySelector('[data-field="message"]').value.trim(),
  };

  const { data, error } = await client.rpc("admin_update_guestbook_entry", payload);
  setStatus(error || !data ? "저장하지 못했습니다. 관리자 권한을 확인해 주세요." : "저장했습니다.");
  await loadRows();
});

adminRsvpList.addEventListener("click", async (event) => {
  const button = event.target.closest('[data-action="delete-rsvp"]');
  if (!button) return;

  const card = button.closest("[data-rsvp-id]");
  const { data, error } = await client.rpc("admin_delete_rsvp_response", {
    p_id: Number(card.dataset.rsvpId),
  });

  setStatus(error || !data ? "참석 응답을 삭제하지 못했습니다." : "참석 응답을 삭제했습니다.");
  await loadRows();
});

logoutButton.addEventListener("click", async () => {
  await client.auth.signOut();
  adminPanel.hidden = true;
  loginForm.hidden = false;
  setStatus("로그아웃했습니다.");
});

if (!client) {
  setStatus("Supabase 설정이 필요합니다.");
} else {
  client.auth.getSession().then(({ data }) => {
    if (data.session) showPanel();
  });
}
