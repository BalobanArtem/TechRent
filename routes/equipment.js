// ============================================================
// routes/equipment.js - Роуты для каталога, аренды и покупки
// ============================================================

const express = require('express');
const router = express.Router();
const { sql, config } = require('../db/dbConfig');

/* =====================================================
   HELPERS
===================================================== */
async function getPool() {
  return await sql.connect(config);
}

/* =====================================================
   1. ПОЛУЧИТЬ ВСЁ ОБОРУДОВАНИЕ (для каталога)
===================================================== */
router.get('/equipment', async (req, res) => {
  try {
    const pool = await getPool();
    
    const result = await pool.request().query(`
      SELECT 
        e.equipment_id,
        e.status,
        e.for_rent,
        e.for_sale,
        e.price_rent,
        e.price_sale,
        e.date_new,
        ed.name as model_name,
        ed.equipDescr_id,
        b.name as brand_name,
        b.brand_id,
        b.country as brand_country,
        t.type_name,
        t.type_id,
        img.url_address as image_url
      FROM Equipment e
      LEFT JOIN EquipDescr ed ON e.equipDescr_id = ed.equipDescr_id
      LEFT JOIN Brand b ON ed.brand_id = b.brand_id
      LEFT JOIN Types t ON ed.type_id = t.type_id
      LEFT JOIN Image img ON ed.equipDescr_id = img.equipDescr_id
      ORDER BY e.equipment_id
    `);
    
    res.json({ success: true, equipment: result.recordset });
    
  } catch (err) {
    console.error('❌ Ошибка получения оборудования:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   2. ПОЛУЧИТЬ КОНКРЕТНОЕ ОБОРУДОВАНИЕ
===================================================== */
router.get('/equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('equipment_id', sql.Int, id)
      .query(`
        SELECT 
          e.equipment_id,
          e.status,
          e.for_rent,
          e.for_sale,
          e.price_rent,
          e.price_sale,
          e.date_new,
          ed.name as model_name,
          ed.equipDescr_id,
          b.name as brand_name,
          b.brand_id,
          b.country as brand_country,
          t.type_name,
          t.type_id,
          img.url_address as image_url
        FROM Equipment e
        LEFT JOIN EquipDescr ed ON e.equipDescr_id = ed.equipDescr_id
        LEFT JOIN Brand b ON ed.brand_id = b.brand_id
        LEFT JOIN Types t ON ed.type_id = t.type_id
        LEFT JOIN Image img ON ed.equipDescr_id = img.equipDescr_id
        WHERE e.equipment_id = @equipment_id
      `);
    
    if (!result.recordset.length) {
      return res.json({ success: false, message: 'Оборудование не найдено' });
    }
    
    res.json({ success: true, equipment: result.recordset[0] });
    
  } catch (err) {
    console.error('❌ Ошибка получения данных:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   3. ПОЛУЧИТЬ ВСЕ БРЕНДЫ (для фильтров)
===================================================== */
router.get('/brands', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT brand_id, name, country FROM Brand ORDER BY name'
    );
    
    res.json({ success: true, brands: result.recordset });
    
  } catch (err) {
    console.error('❌ Ошибка получения брендов:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   4. ПОЛУЧИТЬ ВСЕ ТИПЫ (для фильтров)
===================================================== */
router.get('/types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT type_id, type_name FROM Types ORDER BY type_name'
    );
    
    res.json({ success: true, types: result.recordset });
    
  } catch (err) {
    console.error('❌ Ошибка получения типов:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   5. ОФОРМИТЬ АРЕНДУ
===================================================== */
router.post('/rental', async (req, res) => {
  try {
    const { equipment_id, rent_start, rent_end, total_price, user_name } = req.body;
    let { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Пользователь не авторизован (отсутствует ID)' });
    }

    const pool = await getPool();

    // Получаем user_id из Users, если есть, иначе fallback на profile_id
    const userCheck = await pool.request()
      .input('id', sql.Int, user_id)
      .query('SELECT user_id FROM Users WHERE profile_id = @id OR user_id = @id');

    if (userCheck.recordset.length > 0) {
      user_id = userCheck.recordset[0].user_id;
    } else {
      user_id = user_id; // fallback на profile_id
    }

    // Проверяем оборудование
    const equipmentCheck = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query('SELECT status, for_rent FROM Equipment WHERE equipment_id = @equipment_id');

    if (!equipmentCheck.recordset.length) {
      return res.json({ success: false, message: 'Оборудование не найдено' });
    }

    const equipment = equipmentCheck.recordset[0];
    if (equipment.status === 'rented') return res.json({ success: false, message: 'Оборудование уже арендовано' });
    if (equipment.for_rent !== 'yes') return res.json({ success: false, message: 'Недоступно для аренды' });

    // Создаём аренду
    await pool.request()
      .input('rent_start', sql.DateTime, rent_start)
      .input('rent_end', sql.DateTime, rent_end)
      .input('total_price', sql.Decimal(10, 2), total_price)
      .input('equipment_id', sql.Int, equipment_id)
      .input('user_id', sql.Int, user_id)
      .query(`
        INSERT INTO Rental (rent_start, rent_end, total_price, status, equipment_id, user_id)
        VALUES (@rent_start, @rent_end, @total_price, 'active', @equipment_id, @user_id)
      `);

    await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query('UPDATE Equipment SET status = \'rented\' WHERE equipment_id = @equipment_id');

    res.json({ success: true, message: 'Аренда успешно оформлена' });

  } catch (err) {
    console.error('❌ Ошибка оформления аренды:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   6. ОФОРМИТЬ ПОКУПКУ
===================================================== */
router.post('/purchase', async (req, res) => {
  try {
    const { equipment_id, price, user_name } = req.body;
    let { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Пользователь не авторизован' });
    }

    const pool = await getPool();

    const userCheck = await pool.request()
      .input('id', sql.Int, user_id)
      .query('SELECT user_id FROM Users WHERE profile_id = @id OR user_id = @id');

    if (userCheck.recordset.length > 0) {
      user_id = userCheck.recordset[0].user_id;
    } else {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    // ... (проверки оборудования) ...
    const equipmentCheck = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query('SELECT status, for_sale FROM Equipment WHERE equipment_id = @equipment_id');

    const equipment = equipmentCheck.recordset[0];
    if (!equipment || equipment.status === 'sold' || equipment.for_sale !== 'yes') {
      return res.json({ success: false, message: 'Товар недоступен' });
    }

    await pool.request()
      .input('price', sql.Decimal(10, 2), price)
      .input('user_id', sql.Int, user_id)
      .input('equipment_id', sql.Int, equipment_id)
      .query(`
        INSERT INTO Purchases (purch_date, price, user_id, equipment_id)
        VALUES (GETDATE(), @price, @user_id, @equipment_id)
      `);

    await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query('UPDATE Equipment SET status = \'sold\' WHERE equipment_id = @equipment_id');

    res.json({ success: true, message: 'Покупка успешно оформлена' });

  } catch (err) {
    console.error('❌ Ошибка оформления покупки:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   7. ПОЛУЧИТЬ ПОКУПКИ ПОЛЬЗОВАТЕЛЯ
===================================================== */
router.get('/user/:user_id/purchases', async (req, res) => {
  try {
    const { user_id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        SELECT 
          p.purchases_id,
          p.purch_date,
          p.price,
          e.equipment_id,
          ed.name as model_name,
          b.name as brand_name,
          t.type_name,
          img.url_address as image_url
        FROM Purchases p
        LEFT JOIN Equipment e ON p.equipment_id = e.equipment_id
        LEFT JOIN EquipDescr ed ON e.equipDescr_id = ed.equipDescr_id
        LEFT JOIN Brand b ON ed.brand_id = b.brand_id
        LEFT JOIN Types t ON ed.type_id = t.type_id
        LEFT JOIN Image img ON ed.equipDescr_id = img.equipDescr_id
        WHERE p.user_id = @user_id
        ORDER BY p.purch_date DESC
      `);
    
    res.json({ success: true, purchases: result.recordset });
    
  } catch (err) {
    console.error('❌ Ошибка получения покупок:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/* =====================================================
   8. ПОЛУЧИТЬ АРЕНДЫ ПОЛЬЗОВАТЕЛЯ
===================================================== */
router.get('/user/:user_id/rentals', async (req, res) => {
  try {
    const { user_id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        SELECT 
          r.rental_id,
          r.rent_start,
          r.rent_end,
          r.rent_end_real,
          r.total_price,
          r.status,
          e.equipment_id,
          ed.name as model_name,
          b.name as brand_name,
          t.type_name,
          img.url_address as image_url
        FROM Rental r
        LEFT JOIN Equipment e ON r.equipment_id = e.equipment_id
        LEFT JOIN EquipDescr ed ON e.equipDescr_id = ed.equipDescr_id
        LEFT JOIN Brand b ON ed.brand_id = b.brand_id
        LEFT JOIN Types t ON ed.type_id = t.type_id
        LEFT JOIN Image img ON ed.equipDescr_id = img.equipDescr_id
        WHERE r.user_id = @user_id
        ORDER BY r.rent_start DESC
      `);
    
    res.json({ success: true, rentals: result.recordset });
    
  } catch (err) {
    console.error('❌ Ошибка получения аренд:', err);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

module.exports = router;