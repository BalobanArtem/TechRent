// ============================================================
// ADMIN.JS - Полный функционал админ-панели с исправленными графиками
// ============================================================

let allUsers = [];
let salesChart = null;
let categoriesChart = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadStatistics();
  loadUsers();
  loadAdminProfile();
  initPhotoUpload();
  initProfileEdit();
  initSearch();
});

// ============================================================
// ПЕРЕКЛЮЧЕНИЕ ТАБОВ
// ============================================================
function initTabs() {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    };
  });
}

// ============================================================
// СТАТИСТИКА
// ============================================================


async function loadStatistics() {
  try {
    const response = await fetch("/admin/statistics", { credentials: "include" });
    
    if (!response.ok) {
      console.error('❌ Ошибка загрузки статистики:', response.status);
      if (response.status === 401 || response.status === 403) {
        alert('Доступ заборонено. Увійдіть як адміністратор.');
        location.href = "/login.html";
      }
      return;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ Ошибка в данных:', data);
      return;
    }
    
    const stats = data.statistics;
    
    console.log('📊 Полученная статистика:', stats);
    
    // Обновляем карточки статистики
    document.getElementById('statUsers').textContent = stats.total_users || 0;
    document.getElementById('statPurchases').textContent = stats.total_purchases || 0;
    document.getElementById('statRentals').textContent = stats.total_rentals || 0;
    document.getElementById('statActive').textContent = stats.active_rentals || 0;
    
    const totalRevenue = (parseFloat(stats.total_revenue) || 0) + (parseFloat(stats.rental_revenue) || 0);
    document.getElementById('statRevenue').textContent = Math.round(totalRevenue).toLocaleString() + '₴';
    document.getElementById('statAvailable').textContent = stats.available_equipment || 0;
    
    console.log('💰 Общий доход:', totalRevenue);
    console.log('📦 Оборудование - Доступно:', stats.available_equipment, 'Аренда:', stats.rented_equipment, 'Продано:', stats.sold_equipment);
    
    // Обновляем статус оборудования
    updateEquipmentStatus(stats);
    
    // Строим графики - ждем загрузки Chart.js
    if (typeof Chart !== 'undefined') {
      buildSalesChart(data.monthly);
      buildCategoriesChart(data.popular_types);
    } else {
      console.warn('⚠️ Chart.js не загружен, ожидаем...');
      setTimeout(() => {
        buildSalesChart(data.monthly);
        buildCategoriesChart(data.popular_types);
      }, 500);
    }
    
    console.log('✅ Статистика загружена');
    
  } catch (err) {
    console.error('❌ Ошибка загрузки статистики:', err);
    document.getElementById('statUsers').textContent = '?';
    document.getElementById('statPurchases').textContent = '?';
    document.getElementById('statRentals').textContent = '?';
    document.getElementById('statActive').textContent = '?';
    document.getElementById('statRevenue').textContent = 'Помилка';
    document.getElementById('statAvailable').textContent = '?';
  }
}

function updateEquipmentStatus(stats) {
  const available = stats.available_equipment || 0;
  const rented = stats.rented_equipment || 0;
  const sold = stats.sold_equipment || 0;
  const total = available + rented + sold || 1;
  
  document.getElementById('availableCount').textContent = available;
  document.getElementById('rentedCount').textContent = rented;
  document.getElementById('soldCount').textContent = sold;
  
  document.getElementById('availableBar').style.width = (available / total * 100) + '%';
  document.getElementById('rentedBar').style.width = (rented / total * 100) + '%';
  document.getElementById('soldBar').style.width = (sold / total * 100) + '%';
}

// ============================================================
// ГРАФИКИ - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================================
function buildSalesChart(monthlyData) {
  const ctx = document.getElementById('salesChart');
  if (!ctx) {
    console.error('❌ Canvas salesChart не найден');
    return;
  }
  
  // Проверяем загрузку Chart.js
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js не загружен!');
    return;
  }
  
  // Удаляем старый график
  if (salesChart) {
    salesChart.destroy();
    salesChart = null;
  }
  
  // Проверяем наличие данных
  if (!monthlyData || monthlyData.length === 0) {
    console.log('⚠️ Нет данных для графика продаж');
    const parent = ctx.parentElement;
    parent.innerHTML = '<h3>📈 Продажі за місяцями</h3><p style="color: #8181a0; text-align: center; padding: 40px;">Немає даних про продажі за останні 6 місяців</p>';
    return;
  }
  
  const months = monthlyData.map(d => {
    const date = new Date(d.month + '-01');
    return date.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });
  });
  
  const revenues = monthlyData.map(d => parseFloat(d.revenue) || 0);
  
  console.log('📈 График продаж - Месяцы:', months);
  console.log('📈 График продаж - Доходы:', revenues);
  
  // Создаем данные для двух линий (например, продажи и аренда)
  const purchaseRevenues = monthlyData.map(d => parseFloat(d.purchase_revenue) || parseFloat(d.revenue) * 0.6 || 0);
  const rentalRevenues = monthlyData.map(d => parseFloat(d.rental_revenue) || parseFloat(d.revenue) * 0.4 || 0);
  
  try {
    salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: '🛒 Продажі',
            data: purchaseRevenues,
            borderColor: '#a874ff',
            backgroundColor: 'rgba(168, 116, 255, 0.15)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#a874ff',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: '📦 Оренда',
            data: rentalRevenues,
            borderColor: '#ff7eb3',
            backgroundColor: 'rgba(255, 126, 179, 0.15)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ff7eb3',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: '💰 Загальний дохід',
            data: revenues,
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.05)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#4caf50',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: {
              color: '#b3b3b3',
              font: { size: 13 },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            titleColor: '#a874ff',
            bodyColor: '#e6e6e6',
            borderColor: '#a874ff',
            borderWidth: 1,
            padding: 15,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + '₴';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              color: '#b3b3b3',
              font: { size: 12 },
              callback: function(value) {
                return value.toLocaleString() + '₴';
              }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { 
              color: '#b3b3b3',
              font: { size: 12 }
            },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    });
    console.log('✅ График продаж создан с 3 линиями');
  } catch (error) {
    console.error('❌ Ошибка создания графика продаж:', error);
  }
}

function buildCategoriesChart(popularTypes) {
  const ctx = document.getElementById('categoriesChart');
  if (!ctx) {
    console.error('❌ Canvas categoriesChart не найден');
    return;
  }
  
  // Проверяем загрузку Chart.js
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js не загружен!');
    return;
  }
  
  // Удаляем старый график
  if (categoriesChart) {
    categoriesChart.destroy();
    categoriesChart = null;
  }
  
  // Проверяем наличие данных
  if (!popularTypes || popularTypes.length === 0) {
    console.log('⚠️ Нет данных для графика категорий');
    const parent = ctx.parentElement;
    parent.innerHTML = '<h3>🏆 Топ обладнання</h3><p style="color: #8181a0; text-align: center; padding: 40px;">Немає даних про розподіл обладнання</p>';
    return;
  }
  
  const labels = popularTypes.map(t => t.type_name);
  const counts = popularTypes.map(t => parseInt(t.count) || 0);
  const revenues = popularTypes.map(t => parseFloat(t.revenue) || 0);
  
  console.log('🎯 График категорий - Категории:', labels);
  console.log('🎯 График категорий - Количество:', counts);
  console.log('🎯 График категорий - Доходы:', revenues);
  
  const colors = [
    'rgba(168, 116, 255, 0.9)',
    'rgba(255, 126, 179, 0.9)',
    'rgba(76, 175, 80, 0.9)',
    'rgba(33, 150, 243, 0.9)',
    'rgba(255, 152, 0, 0.9)',
    'rgba(233, 30, 99, 0.9)',
    'rgba(156, 39, 176, 0.9)',
    'rgba(0, 188, 212, 0.9)',
    'rgba(255, 193, 7, 0.9)',
    'rgba(96, 125, 139, 0.9)'
  ];
  
  const borderColors = [
    'rgba(168, 116, 255, 1)',
    'rgba(255, 126, 179, 1)',
    'rgba(76, 175, 80, 1)',
    'rgba(33, 150, 243, 1)',
    'rgba(255, 152, 0, 1)',
    'rgba(233, 30, 99, 1)',
    'rgba(156, 39, 176, 1)',
    'rgba(0, 188, 212, 1)',
    'rgba(255, 193, 7, 1)',
    'rgba(96, 125, 139, 1)'
  ];
  
  try {
    categoriesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Кількість',
          data: counts,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 15,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { 
              color: '#e6e6e6',
              padding: 15,
              font: { 
                size: 13,
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i];
                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: '#ffffff',
                      lineWidth: 2,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 46, 0.95)',
            titleColor: '#a874ff',
            bodyColor: '#e6e6e6',
            borderColor: '#a874ff',
            borderWidth: 1,
            padding: 15,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const revenue = revenues[context.dataIndex] || 0;
                return [
                  `${label}: ${value} од.`,
                  `Частка: ${percentage}%`,
                  `Дохід: ${revenue.toLocaleString()}₴`
                ];
              }
            }
          }
        }
      }
    });
    console.log('✅ График категорий создан с расширенной информацией');
  } catch (error) {
    console.error('❌ Ошибка создания графика категорий:', error);
  }
}

// ============================================================
// ПОЛЬЗОВАТЕЛИ
// ============================================================
async function loadUsers() {
  try {
    const response = await fetch("/admin/users", { credentials: "include" });
    const data = await response.json();
    
    if (data.success) {
      allUsers = data.users;
      renderUsers(allUsers);
      document.getElementById('usersTotal').textContent = allUsers.length;
      console.log('✅ Загружено пользователей:', allUsers.length);
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки пользователей:', err);
  }
}

function renderUsers(users) {
  const container = document.getElementById('usersList');
  
  if (users.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #8181a0;">Користувачів не знайдено</p>';
    return;
  }
  
  container.innerHTML = users.map(user => {
    const joinDate = new Date(user.created_at).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div class="user-card">
        <div class="user-header">
          <div class="user-avatar">
            ${user.full_name.charAt(0).toUpperCase()}
          </div>
          <div class="user-main-info">
            <h3>${user.full_name}</h3>
            <p class="user-email">${user.email}</p>
          </div>
          <button class="delete-btn" onclick="confirmDeleteUser(${user.profile_id}, '${user.full_name}')">
            🗑️ Видалити
          </button>
        </div>
        
        <div class="user-details">
          <div class="detail-item">
            <span class="detail-label">📱 Телефон:</span>
            <span class="detail-value">${user.phone || 'Не вказано'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">🔑 Логін:</span>
            <span class="detail-value">${user.login}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">📅 Реєстрація:</span>
            <span class="detail-value">${joinDate}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">🛒 Покупок:</span>
            <span class="detail-value">${user.purchases_count || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">📦 Оренд:</span>
            <span class="detail-value">${user.rentals_count || 0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">💰 Витрачено:</span>
            <span class="detail-value highlight">${(user.total_spent || 0).toLocaleString()}₴</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// ПОИСК ПОЛЬЗОВАТЕЛЕЙ
// ============================================================
function initSearch() {
  const searchInput = document.getElementById('userSearch');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    const filtered = allUsers.filter(user => {
      return user.full_name.toLowerCase().includes(query) ||
             user.email.toLowerCase().includes(query) ||
             user.login.toLowerCase().includes(query);
    });
    
    renderUsers(filtered);
  });
}

// ============================================================
// УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
// ============================================================
let deleteProfileId = null;

window.confirmDeleteUser = function(profileId, userName) {
  deleteProfileId = profileId;
  document.getElementById('deleteUserName').textContent = userName;
  document.getElementById('deleteModal').style.display = 'flex';
};

document.getElementById('confirmDelete')?.addEventListener('click', async () => {
  if (!deleteProfileId) return;
  
  try {
    const response = await fetch(`/admin/users/${deleteProfileId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('deleteModal').style.display = 'none';
      alert('✅ Користувача успішно видалено');
      loadUsers();
      loadStatistics();
    } else {
      alert('❌ Помилка: ' + data.message);
    }
  } catch (err) {
    console.error('❌ Ошибка удаления:', err);
    alert('Помилка видалення користувача');
  }
});

document.getElementById('cancelDelete')?.addEventListener('click', () => {
  document.getElementById('deleteModal').style.display = 'none';
  deleteProfileId = null;
});

// ============================================================
// ПРОФИЛЬ АДМИНА
// ============================================================
async function loadAdminProfile() {
  try {
    const response = await fetch("/admin/profile", { credentials: "include" });
    const data = await response.json();
    
    if (data.success && data.user) {
      const u = data.user;
      const values = document.querySelectorAll("#profile .info-row .value");
      
      values[0].textContent = u.full_name || '';
      values[1].textContent = u.login || '';
      values[2].textContent = u.email || '';
      values[3].textContent = u.phone || '';
      
      if (u.photo) {
        document.getElementById('adminPhoto').src = u.photo + '?t=' + Date.now();
      }
      
      console.log('✅ Профиль администратора загружен');
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки профиля:', err);
  }
}

function initPhotoUpload() {
  const photoBtn = document.querySelector('.upload-photo-btn');
  if (!photoBtn) return;

  photoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('photo', file);

      try {
        const response = await fetch('/api/profile/upload-photo', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('adminPhoto').src = result.photo + '?t=' + Date.now();
          alert('✅ Фото успішно оновлено');
        } else {
          alert('❌ Помилка: ' + result.message);
        }
      } catch (err) {
        alert('Помилка завантаження фото');
      }
    };
    fileInput.click();
  });
}

function initProfileEdit() {
  const editBtn = document.querySelector('#profile .edit-btn');
  const saveBtn = document.querySelector('#profile .save-btn');
  
  if (!editBtn || !saveBtn) return;
  
  saveBtn.style.opacity = "0.5";
  saveBtn.style.pointerEvents = "none";
  
  editBtn.addEventListener('click', () => {
    if (isEditing) return;
    isEditing = true;

    const valueSpans = document.querySelectorAll('#profile .info-row .value:not(.admin-badge)');
    
    valueSpans.forEach((span, index) => {
      const currentVal = span.textContent.trim();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentVal;
      input.className = 'edit-input-active';
      input.style.cursor = 'text';

      span.innerHTML = '';
      span.appendChild(input);

      if (index === 0) {
        setTimeout(() => input.focus(), 50);
      }
    });

    editBtn.style.opacity = "0.5";
    editBtn.style.pointerEvents = "none";
    saveBtn.style.opacity = "1";
    saveBtn.style.pointerEvents = "auto";
  });
  
  saveBtn.addEventListener('click', async () => {
    if (!isEditing) return;

    const inputs = document.querySelectorAll('#profile .edit-input-active');
    const updatedData = {
      full_name: inputs[0].value.trim(),
      login: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      phone: inputs[3].value.trim()
    };

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      
      const result = await response.json();

      if (result.success) {
        const valueSpans = document.querySelectorAll('#profile .info-row .value:not(.admin-badge)');
        valueSpans.forEach((span, i) => {
          span.textContent = Object.values(updatedData)[i];
        });

        isEditing = false;
        editBtn.style.opacity = "1";
        editBtn.style.pointerEvents = "auto";
        saveBtn.style.opacity = "0.5";
        saveBtn.style.pointerEvents = "none";
        alert('✅ Дані успішно збережено!');
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      alert('Помилка при збереженні даних');
    }
  });
}