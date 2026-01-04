const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sql, config } = require("../db/dbConfig");

const router = express.Router();

/* =====================================================
   HELPERS
===================================================== */
function createSession(req, user) {
  req.session.user = {
    id: user.user_id || user.profile_id,
    profile_id: user.profile_id,
    full_name: user.full_name,
    login: user.login,
    email: user.email,
    phone: user.phone,
    role: user.role,
    photo: user.photo || null
  };
}

async function verifyPassword(input, hash) {
  if (hash.startsWith("$2b$")) {
    return bcrypt.compare(input, hash);
  }
  return String(input).trim() === String(hash).trim();
}

/* =====================================================
   MIDDLEWARE
===================================================== */
function isAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Не авторизован"
    });
  }
  next();
}

function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Доступ запрещён"
    });
  }
  next();
}

/* =====================================================
   AUTH
===================================================== */

/* ===== REGISTER ===== */
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, phone, login, password, password_confirm } = req.body;

    if (!full_name || !email || !phone || !login || !password) {
      return res.status(400).json({ success: false, message: "Все поля обязательны" });
    }

    if (password !== password_confirm) {
      return res.status(400).json({ success: false, message: "Пароли не совпадают" });
    }

    const pool = await sql.connect(config);

    const exists = await pool.request()
      .input("login", sql.NVarChar, login)
      .input("email", sql.NVarChar, email)
      .query(`SELECT 1 FROM ProfileData WHERE login=@login OR email=@email`);

    if (exists.recordset.length) {
      return res.status(409).json({ success: false, message: "Пользователь уже существует" });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.request()
      .input("full_name", sql.NVarChar, full_name)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone)
      .input("login", sql.NVarChar, login)
      .input("password", sql.NVarChar, hash)
      .query(`
        INSERT INTO ProfileData
        (full_name,email,phone,login,password,role,created_at)
        VALUES (@full_name,@email,@phone,@login,@password,'user',GETDATE())
      `);

    res.json({ success: true });

  } catch (e) {
    console.error("REGISTER ERROR:", e);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

/* ===== LOGIN (ЕДИНСТВЕННЫЙ) ===== */
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ success: false, message: "Введите логин и пароль" });
    }

    const pool = await sql.connect(config);

    const result = await pool.request()
      .input("login", sql.NVarChar, login)
      .query(`
        SELECT p.*, u.user_id
        FROM ProfileData p
        LEFT JOIN Users u ON p.profile_id = u.profile_id
        WHERE p.login = @login OR p.email = @login
      `);

    if (!result.recordset.length) {
      return res.status(401).json({ success: false, message: "Неверный логин или пароль" });
    }

    const user = result.recordset[0];
    const match = await verifyPassword(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Неверный логин или пароль" });
    }

    createSession(req, user);

    res.json({
      success: true,
      role: user.role,
      redirect: user.role === "admin" ? "/admin.html" : "/home.html"
    });

  } catch (e) {
    console.error("LOGIN ERROR:", e);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

/* ===== LOGOUT ===== */
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("LOGOUT ERROR:", err);
      return res.status(500).send("Ошибка выхода");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login.html");
  });
});

/* =====================================================
   PROFILE
===================================================== */

router.get("/api/profile", isAuth, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("profile_id", sql.Int, req.session.user.profile_id)
      .query(`
        SELECT profile_id, full_name, email, phone, login, role, photo
        FROM ProfileData
        WHERE profile_id=@profile_id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }

    req.session.user = { ...req.session.user, ...result.recordset[0] };

    res.json({ success: true, user: result.recordset[0] });

  } catch (e) {
    console.error("PROFILE ERROR:", e);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

/* =====================================================
   CURRENT USER (для equipment.js)
===================================================== */

router.get("/api/auth/current-user", async (req, res) => {
  if (req.session && req.session.user) {
    try {
      const pool = await sql.connect(config);
      
      // Получаем user_id из таблицы Users по profile_id
      const result = await pool.request()
        .input('profile_id', sql.Int, req.session.user.profile_id)
        .query('SELECT user_id FROM Users WHERE profile_id = @profile_id');
      
      const user_id = result.recordset.length 
        ? result.recordset[0].user_id 
        : req.session.user.profile_id; // fallback
      
      return res.json({ 
        success: true, 
        user_id: user_id,
        profile_id: req.session.user.profile_id,
        username: req.session.user.full_name || req.session.user.login,
        role: req.session.user.role
      });
    } catch (err) {
      console.error('❌ Ошибка получения user_id:', err);
      // Fallback - возвращаем profile_id
      return res.json({ 
        success: true, 
        user_id: req.session.user.profile_id,
        profile_id: req.session.user.profile_id,
        username: req.session.user.full_name || req.session.user.login,
        role: req.session.user.role
      });
    }
  }
  
  // Если не авторизован
  res.json({ success: false, message: 'Не авторизован' });
});

/* =====================================================
   PROFILE STATISTICS
===================================================== */

router.get("/api/profile/statistics", isAuth, async (req, res) => {
  try {
    const profile_id = req.session.user.profile_id;
    const pool = await sql.connect(config);
    
    // Получаем user_id
    const userResult = await pool.request()
      .input('profile_id', sql.Int, profile_id)
      .query('SELECT user_id FROM Users WHERE profile_id = @profile_id');
    
    if (!userResult.recordset.length) {
      return res.json({ success: true, statistics: { active_rentals: 0, total_orders: 0, total_purchases: 0 }});
    }
    
    const user_id = userResult.recordset[0].user_id;
    
    // Подсчитываем статистику
    const statsResult = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Rental WHERE user_id = @user_id AND status = 'active') as active_rentals,
          (SELECT COUNT(*) FROM Purchases WHERE user_id = @user_id) as total_purchases,
          (SELECT COUNT(*) FROM Rental WHERE user_id = @user_id) + 
          (SELECT COUNT(*) FROM Purchases WHERE user_id = @user_id) as total_orders
      `);
    
    res.json({ 
      success: true, 
      statistics: statsResult.recordset[0] 
    });
    
  } catch (e) {
    console.error("STATISTICS ERROR:", e);
    res.json({ success: true, statistics: { active_rentals: 0, total_orders: 0, total_purchases: 0 }});
  }
});

/* =====================================================
   UPDATE PROFILE DATA
===================================================== */

router.put("/api/profile/update", isAuth, async (req, res) => {
  try {
    const { full_name, login, email, phone } = req.body;
    const profile_id = req.session.user.profile_id;
    
    const pool = await sql.connect(config);
    
    // Проверяем, не занят ли login/email другим пользователем
    const checkExists = await pool.request()
      .input('profile_id', sql.Int, profile_id)
      .input('login', sql.NVarChar, login)
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT 1 FROM ProfileData 
        WHERE (login = @login OR email = @email) 
        AND profile_id != @profile_id
      `);
    
    if (checkExists.recordset.length) {
      return res.status(409).json({ 
        success: false, 
        message: "Логин или email уже заняты" 
      });
    }
    
    // Обновляем данные
    await pool.request()
      .input('profile_id', sql.Int, profile_id)
      .input('full_name', sql.NVarChar, full_name)
      .input('login', sql.NVarChar, login)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .query(`
        UPDATE ProfileData 
        SET full_name = @full_name,
            login = @login,
            email = @email,
            phone = @phone
        WHERE profile_id = @profile_id
      `);
    
    // Обновляем сессию
    req.session.user.full_name = full_name;
    req.session.user.login = login;
    req.session.user.email = email;
    req.session.user.phone = phone;
    
    res.json({ success: true, message: 'Данные обновлены' });
    
  } catch (e) {
    console.error("UPDATE PROFILE ERROR:", e);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

/* =====================================================
   UPLOAD PROFILE PHOTO
===================================================== */

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, "../public/uploads/profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, "profile-" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/api/profile/upload-photo", isAuth, upload.single("photo"), async (req, res) => {
  try {
    const photoPath = "/uploads/profiles/" + req.file.filename;

    const pool = await sql.connect(config);
    await pool.request()
      .input("profile_id", sql.Int, req.session.user.profile_id)
      .input("photo", sql.NVarChar, photoPath)
      .query("UPDATE ProfileData SET photo=@photo WHERE profile_id=@profile_id");

    req.session.user.photo = photoPath;

    res.json({ success: true, photo: photoPath });

  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

/* =====================================================
   ADMIN
===================================================== */

router.get("/admin/users", isAdmin, async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT profile_id, full_name, email, phone, login, created_at
      FROM ProfileData
      WHERE role='user'
      ORDER BY created_at DESC
    `);

    res.json({ success: true, users: result.recordset });

  } catch (e) {
    console.error("ADMIN USERS ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/* =====================================================
   EXPORT
===================================================== */
module.exports = {
  router,
  isAuth,
  isAdmin
};