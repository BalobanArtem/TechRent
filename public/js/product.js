// let currentEquipment = null;
// let currentUserId = null; // ID текущего пользователя (получать из сессии)

// // Загрузка данных при открытии страницы
// document.addEventListener('DOMContentLoaded', async () => {
//   const urlParams = new URLSearchParams(window.location.search);
//   const equipmentId = urlParams.get('id');
  
//   if (!equipmentId) {
//     alert('Товар не найден');
//     window.location.href = 'catalog.html';
//     return;
//   }
  
//   // Получаем ID пользователя из сессии (временно хардкод для теста)
//   currentUserId = await getCurrentUserId();
  
//   await loadProductData(equipmentId);
//   setupEventListeners();
// });

// // Получение ID текущего пользователя
// async function getCurrentUserId() {
//   try {
//     const response = await fetch('/api/auth/current-user');
//     const data = await response.json();
//     return data.success ? data.user_id : 1; // Если не авторизован, временно user_id = 1
//   } catch (err) {
//     console.log('⚠️ Пользователь не авторизован, используем тестовый ID');
//     return 1; // Для тестирования
//   }
// }

// // Загрузка данных товара
// async function loadProductData(equipmentId) {
//   try {
//     const response = await fetch(`/api/equipment/${equipmentId}`);
//     const data = await response.json();
    
//     if (!data.success) {
//       alert('Ошибка загрузки данных товара');
//       window.location.href = 'catalog.html';
//       return;
//     }
    
//     currentEquipment = data.equipment;
//     renderProduct(currentEquipment);
    
//   } catch (err) {
//     console.error('❌ Ошибка загрузки:', err);
//     alert('Ошибка соединения с сервером');
//   }
// }

// // Отрисовка товара
// function renderProduct(equipment) {
//   const imageUrl = equipment.image_url || 'https://via.placeholder.com/600x400/1a1a2e/a874ff?text=Фото+скоро';
  
//   const descriptions = {
//     'Пароконвектоматы': `Профессиональный пароконвектомат ${equipment.brand_name} ${equipment.model_name} - идеальное решение для современной кухни. Равномерное приготовление пищи с использованием пара и конвекции. Производство: ${equipment.brand_country}. Год выпуска: ${new Date(equipment.date_new).getFullYear()}.`,
//     'Холодильное оборудование': `Надежное холодильное оборудование ${equipment.brand_name} ${equipment.model_name}. Подходит для ресторанов, кафе и предприятий общественного питания. Производство: ${equipment.brand_country}. Энергоэффективное, с точным контролем температуры.`,
//     'Тепловое оборудование': `Мощное тепловое оборудование ${equipment.brand_name} ${equipment.model_name}. Профессиональное решение для приготовления большого объема блюд. Производство: ${equipment.brand_country}. Высокая производительность и надежность.`,
//     'Тестомесильное оборудование': `Профессиональное тестомесильное оборудование ${equipment.brand_name} ${equipment.model_name}. Идеально для пекарен и кондитерских цехов. Производство: ${equipment.brand_country}. Равномерный замес, простота в эксплуатации.`,
//     'Фритюрницы': `Профессиональная фритюрница ${equipment.brand_name} ${equipment.model_name}. Быстрое приготовление, равномерная прожарка. Производство: ${equipment.brand_country}. Подходит для кафе, ресторанов быстрого питания.`,
//     'Планетарные миксеры': `Мощный планетарный миксер ${equipment.brand_name} ${equipment.model_name}. Профессиональное оборудование для кондитерских цехов. Производство: ${equipment.brand_country}. Несколько скоростей, надежная конструкция.`,
//     'Слайсеры и куттеры': `Профессиональный слайсер ${equipment.brand_name} ${equipment.model_name}. Точная нарезка продуктов, регулируемая толщина. Производство: ${equipment.brand_country}. Безопасность и высокая производительность.`,
//     'Посудомоечные машины': `Промышленная посудомоечная машина ${equipment.brand_name} ${equipment.model_name}. Быстрая и качественная мойка посуды для HoReCa. Производство: ${equipment.brand_country}. Экономия воды и энергии, высокая производительность.`
//   };
  
//   const description = descriptions[equipment.type_name] || 
//     `Качественное оборудование ${equipment.brand_name} ${equipment.model_name} для профессионального использования. Производство: ${equipment.brand_country}. Надежность и высокое качество.`;
  
//   document.querySelector('.product-img').src = imageUrl;
//   document.querySelector('.product-img').alt = `${equipment.brand_name} ${equipment.model_name}`;
//   document.querySelector('.product-img').onerror = function() {
//     this.src = 'https://via.placeholder.com/600x400/1a1a2e/a874ff?text=Фото+недоступно';
//   };
  
//   document.querySelector('.product-title').textContent = `${equipment.brand_name} ${equipment.model_name}`;
//   document.querySelector('.product-desc').innerHTML = `
//     <p><strong>Категория:</strong> ${equipment.type_name}</p>
//     <p><strong>Производитель:</strong> ${equipment.brand_name} (${equipment.brand_country})</p>
//     <p><strong>Статус:</strong> ${getStatusText(equipment.status)}</p>
//     <p style="margin-top: 15px;">${description}</p>
//   `;
  
//   let priceHTML = '';
//   if (equipment.for_sale === 'yes') {
//     priceHTML += `<div class="price-tag sale"><span>Цена покупки:</span> <strong>${equipment.price_sale.toLocaleString()}₴</strong></div>`;
//   }
//   if (equipment.for_rent === 'yes') {
//     priceHTML += `<div class="price-tag rent"><span>Аренда:</span> <strong>${equipment.price_rent.toLocaleString()}₴/мес</strong></div>`;
//   }
  
//   document.querySelector('.product-price').innerHTML = priceHTML;
  
//   // Показываем кнопки в зависимости от доступности
//   const rentBtn = document.querySelector('.btn.rent');
//   const buyBtn = document.querySelector('.btn.buy');
  
//   if (equipment.for_rent === 'yes' && equipment.status !== 'rented' && equipment.status !== 'sold') {
//     rentBtn.style.display = 'inline-block';
//   } else {
//     rentBtn.style.display = 'none';
//   }
  
//   if (equipment.for_sale === 'yes' && equipment.status !== 'sold') {
//     buyBtn.style.display = 'inline-block';
//   } else {
//     buyBtn.style.display = 'none';
//   }
// }

// // Статус товара
// function getStatusText(status) {
//   const statuses = {
//     'available': '✅ Доступно',
//     'rented': '📅 В аренде',
//     'sold': '🔒 Продано',
//     'maintenance': '🔧 На обслуживании'
//   };
//   return statuses[status] || status;
// }

// // Настройка событий
// function setupEventListeners() {
//   const rentBtn = document.querySelector('.btn.rent');
//   const buyBtn = document.querySelector('.btn.buy');
//   const closeRent = document.getElementById('closeRent');
//   const closeBuy = document.getElementById('closeBuy');
//   const rentForm = document.getElementById('rentForm');
//   const buyForm = document.getElementById('buyForm');
  
//   rentBtn?.addEventListener('click', openRentModal);
//   buyBtn?.addEventListener('click', openBuyModal);
//   closeRent?.addEventListener('click', () => closeModal('rentModal'));
//   closeBuy?.addEventListener('click', () => closeModal('buyModal'));
  
//   rentForm?.addEventListener('submit', handleRentSubmit);
//   buyForm?.addEventListener('submit', handleBuySubmit);
  
//   // Закрытие по клику вне модалки
//   document.querySelectorAll('.modal').forEach(modal => {
//     modal.addEventListener('click', (e) => {
//       if (e.target === modal) closeModal(modal.id);
//     });
//   });
  
//   // Расчет цены аренды
//   document.getElementById('rentStart')?.addEventListener('change', calculateRentalPrice);
//   document.getElementById('rentEnd')?.addEventListener('change', calculateRentalPrice);
  
//   // Расчет цены покупки
//   document.getElementById('buyQuantity')?.addEventListener('input', calculatePurchasePrice);
// }

// // Открыть модалку аренды
// function openRentModal() {
//   document.getElementById('rentEquipment').value = `${currentEquipment.brand_name} ${currentEquipment.model_name}`;
  
//   const today = new Date().toISOString().split('T')[0];
//   document.getElementById('rentStart').min = today;
//   document.getElementById('rentStart').value = '';
//   document.getElementById('rentEnd').value = '';
//   document.getElementById('rentPrice').value = '';
//   document.getElementById('rentUserName').value = '';
  
//   openModal('rentModal');
// }

// // Открыть модалку покупки
// function openBuyModal() {
//   document.getElementById('buyEquipment').value = `${currentEquipment.brand_name} ${currentEquipment.model_name}`;
//   document.getElementById('buyQuantity').value = 1;
//   document.getElementById('buyDate').value = new Date().toLocaleDateString('ru-RU');
//   document.getElementById('buyTotal').value = `${currentEquipment.price_sale.toLocaleString()}₴`;
//   document.getElementById('buyUserName').value = '';
  
//   openModal('buyModal');
// }

// // Расчет цены аренды
// function calculateRentalPrice() {
//   const startDate = document.getElementById('rentStart').value;
//   const endDate = document.getElementById('rentEnd').value;
  
//   if (!startDate || !endDate) {
//     document.getElementById('rentPrice').value = '';
//     return;
//   }
  
//   const start = new Date(startDate);
//   const end = new Date(endDate);
  
//   if (end <= start) {
//     alert('Дата окончания должна быть позже даты начала');
//     document.getElementById('rentEnd').value = '';
//     document.getElementById('rentPrice').value = '';
//     return;
//   }
  
//   const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
//   const months = Math.ceil(days / 30);
//   const totalPrice = months * currentEquipment.price_rent;
  
//   document.getElementById('rentPrice').value = `${totalPrice.toLocaleString()}₴ (${months} мес.)`;
// }

// // Расчет цены покупки
// function calculatePurchasePrice() {
//   const quantity = parseInt(document.getElementById('buyQuantity').value) || 1;
//   const totalPrice = quantity * currentEquipment.price_sale;
//   document.getElementById('buyTotal').value = `${totalPrice.toLocaleString()}₴`;
// }

// // Отправка формы аренды
// async function handleRentSubmit(e) {
//   e.preventDefault();
  
//   const userName = document.getElementById('rentUserName').value.trim();
//   const startDate = document.getElementById('rentStart').value;
//   const endDate = document.getElementById('rentEnd').value;
  
//   if (!userName) {
//     alert('Пожалуйста, введите ваше имя');
//     return;
//   }
  
//   if (!startDate || !endDate) {
//     alert('Пожалуйста, выберите даты аренды');
//     return;
//   }
  
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
//   const months = Math.ceil(days / 30);
//   const totalPrice = months * currentEquipment.price_rent;
  
//   try {
//     const response = await fetch('/api/rental', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         equipment_id: currentEquipment.equipment_id,
//         user_id: currentUserId,
//         rent_start: startDate + 'T00:00:00', // Формат для MSSQL
//         rent_end: endDate + 'T23:59:59',     // Формат для MSSQL
//         total_price: totalPrice,
//         user_name: userName
//       })
//     });
    
//     const data = await response.json();
    
//     if (data.success) {
//       alert('✅ Аренда успешно оформлена! С вами свяжется наш специалист.');
//       closeModal('rentModal');
      
//       // Обновляем статус оборудования
//       await loadProductData(currentEquipment.equipment_id);
//     } else {
//       alert(data.message || 'Ошибка оформления аренды');
//     }
//   } catch (err) {
//     console.error('❌ Ошибка:', err);
//     alert('Ошибка соединения с сервером');
//   }
// }

// // Отправка формы покупки
// async function handleBuySubmit(e) {
//   e.preventDefault();
  
//   const userName = document.getElementById('buyUserName').value.trim();
//   const quantity = parseInt(document.getElementById('buyQuantity').value) || 1;
//   const totalPrice = quantity * currentEquipment.price_sale;
  
//   if (!userName) {
//     alert('Пожалуйста, введите ваше имя');
//     return;
//   }
  
//   if (!confirm(`Подтвердить покупку за ${totalPrice.toLocaleString()}₴?`)) {
//     return;
//   }
  
//   try {
//     const response = await fetch('/api/purchase', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         equipment_id: currentEquipment.equipment_id,
//         user_id: currentUserId,
//         price: totalPrice,
//         quantity: quantity,
//         user_name: userName
//       })
//     });
    
//     const data = await response.json();
    
//     if (data.success) {
//       alert('✅ Покупка успешно оформлена! С вами свяжется наш специалист.');
//       closeModal('buyModal');
      
//       // Обновляем статус оборудования
//       await loadProductData(currentEquipment.equipment_id);
//     } else {
//       alert(data.message || 'Ошибка оформления покупки');
//     }
//   } catch (err) {
//     console.error('❌ Ошибка:', err);
//     alert('Ошибка соединения с сервером');
//   }
// }

// // Открыть модалку
// function openModal(modalId) {
//   document.getElementById(modalId).style.display = 'block';
//   document.body.style.overflow = 'hidden';
// }

// // Закрыть модалку
// function closeModal(modalId) {
//   document.getElementById(modalId).style.display = 'none';
//   document.body.style.overflow = 'auto';
// }