// ============================================================
// МОДАЛЬНЫЕ ОКНА И ФОРМЫ (public/js/details.js)
// ============================================================

let currentEquipment = null;

// Показать детали оборудования
window.showEquipmentDetails = async function(equipmentId) {
  try {
    console.log('🔵 Загрузка деталей оборудования:', equipmentId);
    
    const response = await fetch(`/api/equipment/${equipmentId}`);
    const data = await response.json();
    
    if (!data.success) {
      alert('Помилка завантаження даних');
      return;
    }
    
    currentEquipment = data.equipment;
    renderDetails(currentEquipment);
    openModal('detailsModal');
    
  } catch (err) {
    console.error('❌ Ошибка:', err);
    alert('Помилка завантаження даних');
  }
};

// Отрисовка деталей
function renderDetails(equipment) {
  const imageUrl = equipment.image_url || 'https://via.placeholder.com/400x300/1a1a2e/a874ff?text=Фото+скоро';
  
  // Описания для товаров (пока статичные)
  const descriptions = {
    'Пароконвектоматы': `Професійний пароконвектомат ${equipment.brand_name} ${equipment.model_name} - ідеальне рішення для сучасної кухні. 
    Рівномірне приготування їжі з використанням пари та конвекції. Виробництво: ${equipment.brand_country}. 
    Відмінний стан, рік випуску: ${new Date(equipment.date_new).getFullYear()}.`,
    
    'Холодильное оборудование': `Надійне холодильне обладнання ${equipment.brand_name} ${equipment.model_name}. 
    Підходить для ресторанів, кафе та підприємств громадського харчування. Виробництво: ${equipment.brand_country}. 
    Енергоефективне, з точним контролем температури.`,
    
    'Тепловое оборудование': `Потужне теплове обладнання ${equipment.brand_name} ${equipment.model_name}. 
    Професійне рішення для приготування великого об'єму страв. Виробництво: ${equipment.brand_country}. 
    Висока продуктивність та надійність.`,
    
    'Тестомесильное оборудование': `Професійне тістомісильне обладнання ${equipment.brand_name} ${equipment.model_name}. 
    Ідеально для пекарень та кондитерських цехів. Виробництво: ${equipment.brand_country}. 
    Рівномірний заміс, простота в експлуатації.`,
    
    'Фритюрницы': `Професійна фритюрниця ${equipment.brand_name} ${equipment.model_name}. 
    Швидке приготування, рівномірне обсмажування. Виробництво: ${equipment.brand_country}. 
    Підходить для кафе, ресторанів швидкого харчування.`,
    
    'Планетарные миксеры': `Потужний планетарний міксер ${equipment.brand_name} ${equipment.model_name}. 
    Професійне обладнання для кондитерських цехів. Виробництво: ${equipment.brand_country}. 
    Кілька швидкостей, надійна конструкція.`,
    
    'Слайсеры и куттеры': `Професійний слайсер ${equipment.brand_name} ${equipment.model_name}. 
    Точна нарізка продуктів, регульована товщина. Виробництво: ${equipment.brand_country}. 
    Безпека та висока продуктивність.`,
    
    'Посудомоечные машины': `Промислова посудомийна машина ${equipment.brand_name} ${equipment.model_name}. 
    Швидке та якісне миття посуду для HoReCa. Виробництво: ${equipment.brand_country}. 
    Економія води та енергії, висока продуктивність.`
  };
  
  const description = descriptions[equipment.type_name] || 
    `Якісне обладнання ${equipment.brand_name} ${equipment.model_name} для професійного використання. 
    Виробництво: ${equipment.brand_country}. Надійність та висока якість.`;
  
  const content = `
    <div class="details-container">
      <div class="details-header">
        <div class="details-image">
          <img src="${imageUrl}" alt="${equipment.brand_name} ${equipment.model_name}" 
               onerror="this.src='https://via.placeholder.com/400x300/1a1a2e/a874ff?text=Фото+недоступно'">
        </div>
        <div class="details-info">
          <h2>${equipment.brand_name} ${equipment.model_name}</h2>
          <p><strong>Категорія:</strong> ${equipment.type_name}</p>
          <p><strong>Виробник:</strong> ${equipment.brand_name} (${equipment.brand_country})</p>
          <p><strong>Статус:</strong> ${getStatusText(equipment.status)}</p>
          <p>${description}</p>
          
          <div class="details-price">
            ${equipment.for_sale === 'yes' ? `
              <div class="price-tag">
                <div class="label">Ціна купівлі</div>
                <div class="value">${equipment.price_sale.toLocaleString()}₴</div>
              </div>
            ` : ''}
            ${equipment.for_rent === 'yes' ? `
              <div class="price-tag">
                <div class="label">Оренда / місяць</div>
                <div class="value">${equipment.price_rent.toLocaleString()}₴</div>
              </div>
            ` : ''}
          </div>
          
          <div class="details-actions">
            ${equipment.for_sale === 'yes' && equipment.status !== 'sold' ? `
              <button class="btn-primary" onclick="showPurchaseConfirm()">
                🛒 Купити за ${equipment.price_sale.toLocaleString()}₴
              </button>
            ` : ''}
            ${equipment.for_rent === 'yes' && equipment.status !== 'rented' ? `
              <button class="btn-secondary" onclick="toggleRentalForm()">
                📅 Орендувати
              </button>
            ` : ''}
          </div>
          
          <!-- Форма аренды -->
          <div id="rentalForm" class="rental-form">
            <h3 style="color: #a874ff; margin-bottom: 20px;">📅 Розрахунок оренди</h3>
            <div class="form-group">
              <label>Дата початку оренди:</label>
              <input type="date" id="rentStart" onchange="calculateRental()" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Дата закінчення оренди:</label>
              <input type="date" id="rentEnd" onchange="calculateRental()">
            </div>
            <div class="rental-total">
              <div class="label">Всього до сплати:</div>
              <div class="value" id="rentalTotal">0₴</div>
            </div>
            <button class="btn-primary" onclick="confirmRental()" style="width: 100%;">
              ✅ Підтвердити оренду
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('detailsContent').innerHTML = content;
}

// Текст статуса
function getStatusText(status) {
  const statuses = {
    'available': '✅ Доступно',
    'rented': '📅 В оренді',
    'sold': '🔒 Продано',
    'maintenance': '🔧 На обслуговуванні'
  };
  return statuses[status] || status;
}

// Показать форму аренды
function toggleRentalForm() {
  const form = document.getElementById('rentalForm');
  form.classList.toggle('active');
  
  if (form.classList.contains('active')) {
    // Устанавливаем минимальную дату
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rentStart').min = today;
  }
}

// Расчет стоимости аренды
function calculateRental() {
  const startDate = document.getElementById('rentStart').value;
  const endDate = document.getElementById('rentEnd').value;
  
  if (!startDate || !endDate) {
    document.getElementById('rentalTotal').textContent = '0₴';
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end <= start) {
    alert('Дата закінчення повинна бути пізніше дати початку');
    document.getElementById('rentEnd').value = '';
    document.getElementById('rentalTotal').textContent = '0₴';
    return;
  }
  
  // Расчет количества месяцев
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const months = Math.ceil(days / 30);
  
  const pricePerMonth = currentEquipment.price_rent;
  const totalPrice = months * pricePerMonth;
  
  document.getElementById('rentalTotal').textContent = `${totalPrice.toLocaleString()}₴ (${months} міс.)`;
}

// Подтверждение аренды
async function confirmRental() {
  const startDate = document.getElementById('rentStart').value;
  const endDate = document.getElementById('rentEnd').value;

  if (!startDate || !endDate) {
    alert('Будь ласка, оберіть дати оренди');
    return;
  }

  // Получаем текущего пользователя
  const userRes = await fetch('/api/auth/current-user');
  const userData = await userRes.json();
  if (!userData.success) {
    alert('Ви повинні бути авторизовані для оренди');
    return;
  }

  const user_id = userData.user_id; // берем user_id или profile_id как fallback

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const months = Math.ceil(days / 30);
  const totalPrice = months * currentEquipment.price_rent;

  try {
    const response = await fetch('/api/rental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment_id: currentEquipment.equipment_id,
        rent_start: startDate,
        rent_end: endDate,
        total_price: totalPrice,
        user_id // ✅ добавляем сюда
      })
    });

    const data = await response.json();
    if (data.success) {
      closeModal('detailsModal');
      openModal('thankYouModal');
    } else {
      alert(data.message || 'Помилка оформлення оренди');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
    alert('Помилка з\'єднання з сервером');
  }
}

// Подтверждение покупки
async function showPurchaseConfirm() {
  if (!confirm(`Підтвердити купівлю ${currentEquipment.brand_name} ${currentEquipment.model_name} за ${currentEquipment.price_sale.toLocaleString()}₴?`)) {
    return;
  }
  
  try {
    // Получаем текущего пользователя
    const userRes = await fetch('/api/auth/current-user');
    const userData = await userRes.json();
    if (!userData.success) {
      alert('Ви повинні бути авторизовані для покупки');
      return;
    }

    const user_id = userData.user_id;

    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipment_id: currentEquipment.equipment_id,
        price: currentEquipment.price_sale,
        user_id // ✅ добавляем user_id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModal('detailsModal');
      openModal('thankYouModal');
    } else {
      alert(data.message || 'Помилка оформлення покупки');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
    alert('Помилка з\'єднання з сервером');
  }
}

// Открыть модальное окно
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Закрыть модалку "Спасибо"
function closeThankYou() {
  closeModal('thankYouModal');
  // Перезагружаем каталог, чтобы обновить статусы
  if (typeof loadEquipment === 'function') {
    loadEquipment();
  }
}

// Обработчики закрытия модальных окон
document.addEventListener('DOMContentLoaded', () => {
  // Закрытие по клику на крестик
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      closeModal(modal.id);
    });
  });
  
  // Закрытие по клику вне окна
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal(this.id);
      }
    });
  });
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.style.display === 'block') {
          closeModal(modal.id);
        }
      });
    }
  });
});