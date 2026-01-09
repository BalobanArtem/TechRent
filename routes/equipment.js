// ============================================================
// routes/equipment.js — Роути для каталогу, оренди та купівлі
// ============================================================

const express = require('express');
const router = express.Router();
const { sql, config } = require('../db/dbConfig');

/* =====================================================
   ДОПОМІЖНІ ФУНКЦІЇ
===================================================== */
async function getPool() {
  return await sql.connect(config);
}

/* =====================================================
   1. ОТРИМАТИ ВСЕ ОБЛАДНАННЯ (для каталогу)
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
    console.error('❌ Помилка отримання обладнання:', err);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

/* =====================================================
   2. ОТРИМАТИ КОНКРЕТНЕ ОБЛАДНАННЯ
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
      return res.json({ success: false, message: 'Обладнання не знайдено' });
    }
    
    res.json({ success: true, equipment: result.recordset[0] });
    
  } catch (err) {
    console.error('❌ Помилка отримання даних:', err);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

/* =====================================================
   3. ОТРИМАТИ ВСІ БРЕНДИ (для фільтрів)
===================================================== */
router.get('/brands', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT brand_id, name, country FROM Brand ORDER BY name'
    );
    
    res.json({ success: true, brands: result.recordset });
    
  } catch (err) {
    console.error('❌ Помилка отримання брендів:', err);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

/* =====================================================
   4. ОТРИМАТИ ВСІ ТИПИ (для фільтрів)
===================================================== */
router.get('/types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT type_id, type_name FROM Types ORDER BY type_name'
    );
    
    res.json({ success: true, types: result.recordset });
    
  } catch (err) {
    console.error('❌ Помилка отримання типів:', err);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

/* =====================================================
   5. ОФОРМИТИ ОРЕНДУ
===================================================== */
router.post('/rental', async (req, res) => {
  try {
    const { equipment_id, rent_start, rent_end, total_price, user_name } = req.body;
    let { user_id } = req.body;

    console.log('📦 Запит на оренду:', { equipment_id, user_id, total_price });

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Користувач не авторизований (відсутній ID)' });
    }

    const pool = await getPool();

    // Отримуємо user_id з таблиці Users
    const userCheck = await pool.request()
      .input('id', sql.Int, user_id)
      .query('SELECT user_id FROM Users WHERE profile_id = @id OR user_id = @id');

    if (userCheck.recordset.length > 0) {
      user_id = userCheck.recordset[0].user_id;
    }

    // Перевіряємо обладнання
    const equipmentCheck = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query('SELECT status, for_rent FROM Equipment WHERE equipment_id = @equipment_id');

    if (!equipmentCheck.recordset.length) {
      return res.json({ success: false, message: 'Обладнання не знайдено' });
    }

    const equipment = equipmentCheck.recordset[0];
    
    if (equipment.status === 'rented') {
      return res.json({ success: false, message: 'Обладнання вже в оренді' });
    }
    
    if (equipment.for_rent !== 'yes') {
      return res.json({ success: false, message: 'Недоступне для оренди' });
    }

    // Створюємо запис оренди
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

    console.log(`✅ Запис у Rental створено`);

    // 🔥 АВТОМАТИЧНО оновлюємо статус обладнання
    const updateResult = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query(`
        UPDATE Equipment 
        SET for_rent = 'no', status = 'rented'
        WHERE equipment_id = @equipment_id
      `);

    console.log(`✅ Статус оновлено: equipment_id=${equipment_id}, оновлено рядків: ${updateResult.rowsAffected[0]}`);

    res.json({ success: true, message: 'Оренду успішно оформлено' });

  } catch (err) {
    console.error('❌ Помилка оформлення оренди:', err);
    console.error('❌ Деталі:', err.message);
    res.status(500).json({ success: false, message: 'Помилка сервера: ' + err.message });
  }
});

/* =====================================================
   6. ОФОРМИТИ КУПІВЛЮ
===================================================== */
router.post('/purchase', async (req, res) => {
  try {
    const { equipment_id, price, user_name } = req.body;
    let { user_id } = req.body;

    console.log('💰 Запит на купівлю:', { equipment_id, user_id, price });

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Користувач не авторизований' });
    }

    const pool = await getPool();

    // Отримуємо user_id з Users
    const userCheck = await pool.request()
      .input('id', sql.Int, user_id)
      .query('SELECT user_id FROM Users WHERE profile_id = @id OR user_id = @id');

    if (userCheck.recordset.length > 0) {
      user_id = userCheck.recordset[0].user_id;
    } else {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    // Перевіряємо обладнання
    const equipmentCheck = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query('SELECT status, for_sale FROM Equipment WHERE equipment_id = @equipment_id');

    if (!equipmentCheck.recordset.length) {
      return res.json({ success: false, message: 'Обладнання не знайдено' });
    }

    const equipment = equipmentCheck.recordset[0];
    
    if (equipment.status === 'sold') {
      return res.json({ success: false, message: 'Товар вже продано' });
    }
    
    if (equipment.for_sale !== 'yes') {
      return res.json({ success: false, message: 'Товар недоступний для купівлі' });
    }

    // Створюємо запис купівлі
    await pool.request()
      .input('price', sql.Decimal(10, 2), price)
      .input('user_id', sql.Int, user_id)
      .input('equipment_id', sql.Int, equipment_id)
      .query(`
        INSERT INTO Purchases (purch_date, price, user_id, equipment_id)
        VALUES (GETDATE(), @price, @user_id, @equipment_id)
      `);

    console.log(`✅ Запис у Purchases створено`);

    // 🔥 АВТОМАТИЧНО оновлюємо статус обладнання
    const updateResult = await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query(`
        UPDATE Equipment 
        SET for_sale = 'no', status = 'sold'
        WHERE equipment_id = @equipment_id
      `);

    console.log(`✅ Статус оновлено: equipment_id=${equipment_id}, оновлено рядків: ${updateResult.rowsAffected[0]}`);

    res.json({ success: true, message: 'Купівлю успішно оформлено' });

  } catch (err) {
    console.error('❌ Помилка оформлення купівлі:', err);
    console.error('❌ Деталі:', err.message);
    res.status(500).json({ success: false, message: 'Помилка сервера: ' + err.message });
  }
});

/* =====================================================
   7. ОТРИМАТИ ПОКУПКИ КОРИСТУВАЧА
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
    console.error('❌ Помилка отримання покупок:', err);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

/* =====================================================
   8. ОТРИМАТИ ОРЕНДИ КОРИСТУВАЧА
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
    console.error('❌ Помилка отримання оренд:', err);
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
});

/* =====================================================
   9. ПОВЕРНЕННЯ ОБЛАДНАННЯ З ОРЕНДИ (для адмін-панелі)
===================================================== */
router.post('/equipment/return', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    
    const pool = await getPool();
    
    // Оновлюємо статус — повертаємо в доступні
    await pool.request()
      .input('equipment_id', sql.Int, equipment_id)
      .query(`
        UPDATE Equipment 
        SET for_rent = 'yes', status = 'available'
        WHERE equipment_id = @equipment_id
      `);
    
    console.log(`✅ Обладнання ${equipment_id} повернено та доступне`);
    
    res.json({ success: true, message: 'Обладнання повернено та доступне для оренди' });
    
  } catch (e) {
    console.error('❌ ПОМИЛКА ПОВЕРНЕННЯ:', e);
    res.status(500).json({ success: false, message: 'Помилка сервера: ' + e.message });
  }
});

module.exports = router;
