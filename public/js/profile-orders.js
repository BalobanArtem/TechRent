// ============================================================
// ПРОФИЛЬ - ПОКУПКИ И АРЕНДЫ (profile-orders.js)
// ============================================================

let currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUserId = await getCurrentUserId();
  
  // Загружаем статистику
  await loadStatistics();
  
  // Загружаем заказы при переключении табов
  const purchasesTab = document.querySelector('[data-tab="purchases"]');
  const rentalsTab = document.querySelector('[data-tab="rentals"]');
  
  if (purchasesTab) {
    purchasesTab.addEventListener('click', loadPurchases);
  }
  
  if (rentalsTab) {
    rentalsTab.addEventListener('click', loadRentals);
  }
});

// Получение ID текущего пользователя
async function getCurrentUserId() {
  try {
    const response = await fetch('/api/auth/current-user');
    const data = await response.json();
    return data.success ? data.user_id : null;
  } catch (err) {
    console.log('⚠️ Ошибка получения user_id:', err);
    return null;
  }
}

// Переключение табов (вызывается из HTML)
window.switchTab = function(tabName) {
  // Скрываем все табы
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Убираем active у всех пунктов меню
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Показываем нужный таб
  const targetContent = document.getElementById(tabName + 'Content');
  if (targetContent) {
    targetContent.classList.add('active');
  }
  
  // Активируем пункт меню
  const targetNav = document.querySelector(`[data-tab="${tabName}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
  // Загружаем данные при необходимости
  if (tabName === 'purchases') {
    loadPurchases();
  } else if (tabName === 'rentals') {
    loadRentals();
  }
};

// Загрузка покупок
async function loadPurchases() {
  if (!currentUserId) {
    console.error('❌ User ID не найден');
    return;
  }
  
  try {
    const response = await fetch(`/api/user/${currentUserId}/purchases`);
    const data = await response.json();
    
    if (data.success) {
      renderPurchases(data.purchases);
      console.log('✅ Загружено покупок:', data.purchases.length);
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки покупок:', err);
    document.getElementById('purchasesList').innerHTML = '<p style="color: #ff6b6b;">Ошибка загрузки данных</p>';
  }
}

// Загрузка аренд
async function loadRentals() {
  if (!currentUserId) {
    console.error('❌ User ID не найден');
    return;
  }
  
  try {
    const response = await fetch(`/api/user/${currentUserId}/rentals`);
    const data = await response.json();
    
    if (data.success) {
      renderRentals(data.rentals);
      console.log('✅ Загружено аренд:', data.rentals.length);
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки аренд:', err);
    document.getElementById('rentalsList').innerHTML = '<p style="color: #ff6b6b;">Ошибка загрузки данных</p>';
  }
}

// Отрисовка покупок
function renderPurchases(purchases) {
  const container = document.getElementById('purchasesList');
  
  if (!container) {
    console.error('❌ Контейнер purchasesList не найден');
    return;
  }
  
  if (purchases.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #8181a0;">
        <p style="font-size: 18px;">🛍️ У вас пока нет совершенных покупок</p>
        <a href="catalog.html" style="
          display: inline-block;
          margin-top: 20px;
          padding: 12px 30px;
          background: linear-gradient(135deg, #a874ff 0%, #8b5cf6 100%);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.3s ease;
        ">Перейти в каталог</a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = purchases.map(item => {
    const imageUrl = item.image_url || 'https://via.placeholder.com/150x100/1a1a2e/a874ff?text=Фото';
    const purchDate = new Date(item.purch_date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div style="
        background: rgba(29, 29, 43, 0.6);
        border: 1px solid rgba(168, 116, 255, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 20px;
        align-items: center;
        transition: all 0.3s ease;
      " onmouseover="this.style.borderColor='rgba(168, 116, 255, 0.5)'" 
         onmouseout="this.style.borderColor='rgba(168, 116, 255, 0.2)'">
        
        <img src="${imageUrl}" alt="${item.brand_name} ${item.model_name}" 
             style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px;"
             onerror="this.src='https://via.placeholder.com/150x100/1a1a2e/a874ff?text=Фото'">
        
        <div>
          <h3 style="color: #e6e6e6; margin: 0 0 8px 0; font-size: 18px;">
            ${item.brand_name} ${item.model_name}
          </h3>
          <p style="color: #a874ff; margin: 0 0 5px 0; font-size: 14px;">${item.type_name}</p>
          <p style="color: #b3b3b3; margin: 0; font-size: 14px;">📅 ${purchDate}</p>
          <p style="color: #4caf50; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">
            💰 ${item.price.toLocaleString()}₴
          </p>
        </div>
      </div>
    `;
  }).join('');
}

// Отрисовка аренд
function renderRentals(rentals) {
  const container = document.getElementById('rentalsList');
  
  if (!container) {
    console.error('❌ Контейнер rentalsList не найден');
    return;
  }
  
  if (rentals.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #8181a0;">
        <p style="font-size: 18px;">📦 У вас нет активных аренд</p>
        <a href="catalog.html" style="
          display: inline-block;
          margin-top: 20px;
          padding: 12px 30px;
          background: linear-gradient(135deg, #a874ff 0%, #8b5cf6 100%);
          color: white;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.3s ease;
        ">Перейти в каталог</a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = rentals.map(item => {
    const imageUrl = item.image_url || 'https://via.placeholder.com/150x100/1a1a2e/a874ff?text=Фото';
    const startDate = new Date(item.rent_start).toLocaleDateString('ru-RU');
    const endDate = new Date(item.rent_end).toLocaleDateString('ru-RU');
    
    const statusText = {
      'active': '✅ Активна',
      'completed': '✔️ Завершена',
      'cancelled': '❌ Отменена'
    };
    
    const statusColor = {
      'active': '#4caf50',
      'completed': '#2196f3',
      'cancelled': '#f44336'
    };
    
    return `
      <div style="
        background: rgba(29, 29, 43, 0.6);
        border: 1px solid rgba(168, 116, 255, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 20px;
        align-items: center;
        transition: all 0.3s ease;
      " onmouseover="this.style.borderColor='rgba(168, 116, 255, 0.5)'" 
         onmouseout="this.style.borderColor='rgba(168, 116, 255, 0.2)'">
        
        <img src="${imageUrl}" alt="${item.brand_name} ${item.model_name}" 
             style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px;"
             onerror="this.src='https://via.placeholder.com/150x100/1a1a2e/a874ff?text=Фото'">
        
        <div>
          <h3 style="color: #e6e6e6; margin: 0 0 8px 0; font-size: 18px;">
            ${item.brand_name} ${item.model_name}
          </h3>
          <p style="color: #a874ff; margin: 0 0 5px 0; font-size: 14px;">${item.type_name}</p>
          <p style="color: #b3b3b3; margin: 0; font-size: 14px;">📅 С ${startDate} по ${endDate}</p>
          <p style="color: #ff9800; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">
            💰 ${item.total_price.toLocaleString()}₴
          </p>
          <p style="color: ${statusColor[item.status] || '#b3b3b3'}; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">
            ${statusText[item.status] || item.status}
          </p>
        </div>
      </div>
    `;
  }).join('');
}

// Загрузка статистики
async function loadStatistics() {
  if (!currentUserId) {
    console.error('❌ User ID не найден для статистики');
    return;
  }
  
  try {
    // Загружаем покупки и аренды для подсчета
    const [purchasesRes, rentalsRes] = await Promise.all([
      fetch(`/api/user/${currentUserId}/purchases`),
      fetch(`/api/user/${currentUserId}/rentals`)
    ]);
    
    const purchasesData = await purchasesRes.json();
    const rentalsData = await rentalsRes.json();
    
    if (purchasesData.success && rentalsData.success) {
      const activeRentals = rentalsData.rentals.filter(r => r.status === 'active').length;
      const totalOrders = purchasesData.purchases.length + rentalsData.rentals.length;
      const totalPurchases = purchasesData.purchases.length;
      
      // Обновляем статистику на странице
      const statCards = document.querySelectorAll('.stat-card .number');
      if (statCards.length >= 3) {
        statCards[0].textContent = activeRentals;
        statCards[1].textContent = totalOrders;
        statCards[2].textContent = totalPurchases;
      }
      
      console.log('✅ Статистика обновлена:', { activeRentals, totalOrders, totalPurchases });
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки статистики:', err);
  }
}