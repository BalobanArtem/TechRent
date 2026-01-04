let allEquipment = []; // Все оборудование
let filteredEquipment = []; // Отфильтрованное оборудование

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  await loadFilters();
  await loadEquipment();
  setupEventListeners();
});

// Загрузка фильтров (бренды и типы)
async function loadFilters() {
  try {
    // Загрузка брендов
    const brandsRes = await fetch('/api/brands');
    const brandsData = await brandsRes.json();
    
    const brandFilter = document.getElementById('brandFilter');
    brandFilter.innerHTML = '<option value="all">Все бренды</option>';
    
    if (brandsData.success) {
      brandsData.brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.brand_id;
        option.textContent = brand.name;
        brandFilter.appendChild(option);
      });
    }
    
    // Загрузка типов
    const typesRes = await fetch('/api/types');
    const typesData = await typesRes.json();
    
    const typeFilter = document.getElementById('typeFilter');
    typeFilter.innerHTML = '<option value="all">Все категории</option>';
    
    if (typesData.success) {
      typesData.types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.type_id;
        option.textContent = type.type_name;
        typeFilter.appendChild(option);
      });
    }
    
    console.log('✅ Фильтры загружены');
  } catch (err) {
    console.error('❌ Ошибка загрузки фильтров:', err);
  }
}

// Загрузка оборудования
async function loadEquipment() {
  try {
    const response = await fetch('/api/equipment');
    const data = await response.json();
    
    if (data.success) {
      allEquipment = data.equipment;
      filteredEquipment = [...allEquipment];
      renderEquipment(filteredEquipment);
      console.log('✅ Загружено оборудования:', allEquipment.length);
    } else {
      console.error('Ошибка загрузки оборудования');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

// Отрисовка карточек оборудования
function renderEquipment(equipment) {
  const catalog = document.querySelector('.catalog');
  
  if (equipment.length === 0) {
    catalog.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #b79cff;">
        <h2>😔 Оборудование не найдено</h2>
        <p style="margin-top: 10px; color: #8181a0;">Попробуйте изменить параметры поиска или сбросить фильтры</p>
      </div>
    `;
    return;
  }
  
  catalog.innerHTML = equipment.map(item => {
    // Определяем описание (можно будет заменить на поле из БД)
    const descriptions = {
      'Пароконвектоматы': 'Профессиональное оборудование для приготовления пищи с паром',
      'Холодильное оборудование': 'Надежное холодильное оборудование для хранения продуктов',
      'Тепловое оборудование': 'Мощное тепловое оборудование для профессиональной кухни',
      'Тестомесильное оборудование': 'Качественное оборудование для замеса теста',
      'Фритюрницы': 'Профессиональные фритюрницы для жарки',
      'Планетарные миксеры': 'Мощные планетарные миксеры для кондитерских',
      'Слайсеры и куттеры': 'Профессиональное оборудование для нарезки продуктов',
      'Посудомоечные машины': 'Промышленные посудомоечные машины для кафе и ресторанов'
    };
    
    const description = descriptions[item.type_name] || 'Качественное оборудование для профессионального использования';
    
    // Проверка наличия фото
    const imageUrl = item.image_url || 'https://via.placeholder.com/400x280/1a1a2e/a874ff?text=Фото+скоро';
    
    return `
      <div class="card" data-id="${item.equipment_id}">
        <div class="card-img">
          <img src="${imageUrl}" alt="${item.brand_name} ${item.model_name}" onerror="this.src='https://via.placeholder.com/400x280/1a1a2e/a874ff?text=Фото+недоступно'">
        </div>
        <div class="card-content">
          <h3>${item.brand_name} ${item.model_name}</h3>
          <p class="desc">${description}</p>
          <div class="price-block">
            ${item.for_rent === 'yes' ? `
              <div class="price-item">
                <span class="price-label">Аренда</span>
                <span class="price-value">${item.price_rent}₴/день</span>
              </div>
            ` : ''}
            ${item.for_sale === 'yes' ? `
              <div class="price-item">
                <span class="price-label">Покупка</span>
                <span class="price-value">${item.price_sale.toLocaleString()}₴</span>
              </div>
            ` : ''}
          </div>
        </div>
        <button class="details-btn" onclick="showDetails(${item.equipment_id})">
          <span>Подробнее</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
  
  console.log('✅ Отрисовано карточек:', equipment.length);
}

// Настройка обработчиков событий
function setupEventListeners() {
  const typeFilter = document.getElementById('typeFilter');
  const brandFilter = document.getElementById('brandFilter');
  const priceSort = document.getElementById('priceSort');
  const searchInput = document.getElementById('searchInput');
  const resetBtn = document.getElementById('resetFilters');
  
  // Фильтрация по типу
  typeFilter.addEventListener('change', applyFilters);
  
  // Фильтрация по бренду
  brandFilter.addEventListener('change', applyFilters);
  
  // Сортировка по цене
  priceSort.addEventListener('change', applyFilters);
  
  // Поиск по названию
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  // Кнопка сброса фильтров
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
}

// Сброс всех фильтров
function resetFilters() {
  document.getElementById('typeFilter').value = 'all';
  document.getElementById('brandFilter').value = 'all';
  document.getElementById('priceSort').value = 'none';
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  applyFilters();
  console.log('🔄 Фильтры сброшены');
}

// Применение всех фильтров
function applyFilters() {
  const typeFilter = document.getElementById('typeFilter').value;
  const brandFilter = document.getElementById('brandFilter').value;
  const priceSort = document.getElementById('priceSort').value;
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  
  // Фильтрация
  filteredEquipment = allEquipment.filter(item => {
    // Фильтр по типу
    if (typeFilter !== 'all' && item.type_id != typeFilter) {
      return false;
    }
    
    // Фильтр по бренду
    if (brandFilter !== 'all' && item.brand_id != brandFilter) {
      return false;
    }
    
    // Поиск по названию
    if (searchQuery) {
      const fullName = `${item.brand_name} ${item.model_name} ${item.type_name}`.toLowerCase();
      if (!fullName.includes(searchQuery)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Сортировка по цене
  if (priceSort === 'asc') {
    filteredEquipment.sort((a, b) => {
      const priceA = a.price_sale || a.price_rent * 30;
      const priceB = b.price_sale || b.price_rent * 30;
      return priceA - priceB;
    });
  } else if (priceSort === 'desc') {
    filteredEquipment.sort((a, b) => {
      const priceA = a.price_sale || a.price_rent * 30;
      const priceB = b.price_sale || b.price_rent * 30;
      return priceB - priceA;
    });
  }
  
  renderEquipment(filteredEquipment);
  console.log('🔍 Найдено:', filteredEquipment.length, 'из', allEquipment.length);
}

// Показать детали (заглушка)
function showDetails(equipmentId) {
  // Эта функция теперь в details.js
  window.showEquipmentDetails(equipmentId);
}