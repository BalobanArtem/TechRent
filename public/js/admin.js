// ====== TABS ======
document.querySelectorAll("nav button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// ====== STATISTICS ======
fetch("/admin/statistics", { credentials: "include" })
  .then(r => r.json())
  .then(d => {
    if (!d.success) return location.href = "/login.html";

    statsGrid.innerHTML = `
      <div>👥 Пользователи: ${d.statistics.total_users}</div>
      <div>📦 Аренды: ${d.statistics.total_rentals}</div>
      <div>🔥 Активные: ${d.statistics.active_rentals}</div>
      <div>💰 Доход: ${d.statistics.total_revenue}</div>
    `;
  });

// ====== USERS ======
fetch("/admin/users", { credentials: "include" })
  .then(r => r.json())
  .then(d => {
    usersList.innerHTML = d.users.map(u => `
      <div class="user">
        <b>${u.full_name}</b><br>
        ${u.email}
      </div>
    `).join("");
  });

// ====== PROFILE ======
fetch("/admin/profile", { credentials: "include" })
  .then(r => r.json())
  .then(d => {
    adminProfile.innerHTML = `
      <p><b>Имя:</b> ${d.user.full_name}</p>
      <p><b>Email:</b> ${d.user.email}</p>
      <p><b>Роль:</b> ADMIN</p>
    `;
  });