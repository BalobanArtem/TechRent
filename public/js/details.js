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
      alert('Ошибка загрузки данных');
      return;
    }
    
    currentEquipment = data.equipment;
    renderDetails(currentEquipment);
    openModal('detailsModal');
    
  } catch (err) {
    console.error('❌ Ошибка:', err);
    alert('Ошибка загрузки данных');
  }
};

// Отрисовка деталей
function renderDetails(equipment) {
  const imageUrl = equipment.image_url || 'https://via.placeholder.com/400x300/1a1a2e/a874ff?text=Фото+скоро';
  
  // Описания для товаров (пока статичные)
  const descriptions = {
    'Пароконвектоматы': `Профессиональный пароконвектомат ${equipment.brand_name} ${equipment.model_name} - идеальное решение для современной кухни. 
    Равномерное приготовление пищи с использованием пара и конвекции. Производство: ${equipment.brand_country}. 
    Отличное состояние, год выпуска: ${new Date(equipment.date_new).getFullYear()}.`,
    
    'Холодильное оборудование': `Надежное холодильное оборудование ${equipment.brand_name} ${equipment.model_name}. 
    Подходит для ресторанов, кафе и предприятий общественного питания. Производство: ${equipment.brand_country}. 
    Энергоэффективное, с точным контролем температуры.`,
    
    'Тепловое оборудование': `Мощное тепловое оборудование ${equipment.brand_name} ${equipment.model_name}. 
    Профессиональное решение для приготовления большого объема блюд. Производство: ${equipment.brand_country}. 
    Высокая производительность и надежность.`,
    
    'Тестомесильное оборудование': `Профессиональное тестомесильное оборудование ${equipment.brand_name} ${equipment.model_name}. 
    Идеально для пекарен и кондитерских цехов. Производство: ${equipment.brand_country}. 
    Равномерный замес, простота в эксплуатации.`,
    
    'Фритюрницы': `Профессиональная фритюрница ${equipment.brand_name} ${equipment.model_name}. 
    Быстрое приготовление, равномерная прожарка. Производство: ${equipment.brand_country}. 
    Подходит для кафе, ресторанов быстрого питания.`,
    
    'Планетарные миксеры': `Мощный планетарный миксер ${equipment.brand_name} ${equipment.model_name}. 
    Профессиональное оборудование для кондитерских цехов. Производство: ${equipment.brand_country}. 
    Несколько скоростей, надежная конструкция.`,
    
    'Слайсеры и куттеры': `Профессиональный слайсер ${equipment.brand_name} ${equipment.model_name}. 
    Точная нарезка продуктов, регулируемая толщина. Производство: ${equipment.brand_country}. 
    Безопасность и высокая производительность.`,
    
    'Посудомоечные машины': `Промышленная посудомоечная машина ${equipment.brand_name} ${equipment.model_name}. 
    Быстрая и качественная мойка посуды для HoReCa. Производство: ${equipment.brand_country}. 
    Экономия воды и энергии, высокая производительность.`
  };
  
  const description = descriptions[equipment.type_name] || 
    `Качественное оборудование ${equipment.brand_name} ${equipment.model_name} для профессионального использования. 
    Производство: ${equipment.brand_country}. Надежность и высокое качество.`;
  
  const content = `
    <div class="details-container">
      <div class="details-header">
        <div class="details-image">
          <img src="${imageUrl}" alt="${equipment.brand_name} ${equipment.model_name}" 
               onerror="this.src='https://via.placeholder.com/400x300/1a1a2e/a874ff?text=Фото+недоступно'">
        </div>
        <div class="details-info">
          <h2>${equipment.brand_name} ${equipment.model_name}</h2>
          <p><strong>Категория:</strong> ${equipment.type_name}</p>
          <p><strong>Производитель:</strong> ${equipment.brand_name} (${equipment.brand_country})</p>
          <p><strong>Статус:</strong> ${getStatusText(equipment.status)}</p>
          <p>${description}</p>
          
          <div class="details-price">
            ${equipment.for_sale === 'yes' ? `
              <div class="price-tag">
                <div class="label">Цена покупки</div>
                <div class="value">${equipment.price_sale.toLocaleString()}₴</div>
              </div>
            ` : ''}
            ${equipment.for_rent === 'yes' ? `
              <div class="price-tag">
                <div class="label">Аренда / месяц</div>
                <div class="value">${equipment.price_rent.toLocaleString()}₴</div>
              </div>
            ` : ''}
          </div>
          
          <div class="details-actions">
            ${equipment.for_sale === 'yes' && equipment.status !== 'sold' ? `
              <button class="btn-primary" onclick="showPurchaseConfirm()">
                🛒 Купить за ${equipment.price_sale.toLocaleString()}₴
              </button>
            ` : ''}
            ${equipment.for_rent === 'yes' && equipment.status !== 'rented' ? `
              <button class="btn-secondary" onclick="toggleRentalForm()">
                📅 Арендовать
              </button>
            ` : ''}
          </div>
          
          <!-- Форма аренды -->
          <div id="rentalForm" class="rental-form">
            <h3 style="color: #a874ff; margin-bottom: 20px;">📅 Расчет аренды</h3>
            <div class="form-group">
              <label>Дата начала аренды:</label>
              <input type="date" id="rentStart" onchange="calculateRental()" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Дата окончания аренды:</label>
              <input type="date" id="rentEnd" onchange="calculateRental()">
            </div>
            <div class="rental-total">
              <div class="label">Итого к оплате:</div>
              <div class="value" id="rentalTotal">0₴</div>
            </div>
            <button class="btn-primary" onclick="confirmRental()" style="width: 100%;">
              ✅ Подтвердить аренду
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
    'rented': '📅 В аренде',
    'sold': '🔒 Продано',
    'maintenance': '🔧 На обслуживании'
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
    alert('Дата окончания должна быть позже даты начала');
    document.getElementById('rentEnd').value = '';
    document.getElementById('rentalTotal').textContent = '0₴';
    return;
  }
  
  // Расчет количества месяцев
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const months = Math.ceil(days / 30);
  
  const pricePerMonth = currentEquipment.price_rent;
  const totalPrice = months * pricePerMonth;
  
  document.getElementById('rentalTotal').textContent = `${totalPrice.toLocaleString()}₴ (${months} мес.)`;
}

// Подтверждение аренды
async function confirmRental() {
  const startDate = document.getElementById('rentStart').value;
  const endDate = document.getElementById('rentEnd').value;

  if (!startDate || !endDate) {
    alert('Пожалуйста, выберите даты аренды');
    return;
  }

  // Получаем текущего пользователя
  const userRes = await fetch('/api/auth/current-user');
  const userData = await userRes.json();
  if (!userData.success) {
    alert('Вы должны быть авторизованы для аренды');
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
      alert(data.message || 'Ошибка оформления аренды');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
    alert('Ошибка соединения с сервером');
  }
}

// Подтверждение покупки
async function showPurchaseConfirm() {
  if (!confirm(`Подтвердить покупку ${currentEquipment.brand_name} ${currentEquipment.model_name} за ${currentEquipment.price_sale.toLocaleString()}₴?`)) {
    return;
  }
  
  try {
    // Получаем текущего пользователя
    const userRes = await fetch('/api/auth/current-user');
    const userData = await userRes.json();
    if (!userData.success) {
      alert('Вы должны быть авторизованы для покупки');
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
      alert(data.message || 'Ошибка оформления покупки');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
    alert('Ошибка соединения с сервером');
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