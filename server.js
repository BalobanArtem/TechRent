const express = require("express");
const session = require("express-session");
const path = require("path");

const { router: authRouter } = require("./routes/auth");
const equipmentRouter = require("./routes/equipment"); // ← ДОБАВЛЕНО

const app = express();

/* ===============================
   Middleware
=============================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: "techrent-secret-key-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

/* ===============================
   ROOT → login.html
=============================== */
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect(
      req.session.user.role === "admin"
        ? "/admin.html"
        : "/home.html"
    );
  }
  res.redirect("/login.html");
});

/* ===============================
   Routes (ВАЖНО: до static!)
=============================== */
app.use("/", authRouter);
app.use("/api", equipmentRouter);

/* ===============================
   Static files
=============================== */
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   Protected pages
=============================== */
app.get("/profile.html", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/home.html", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/catalog.html", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "catalog.html"));
});

app.get("/product.html", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/admin.html", (req, res) => {
  console.log('📍 Запрос /admin.html');
  console.log('🔐 Сессия:', req.session.user ? 'Есть' : 'Нет');
  console.log('👤 Роль:', req.session.user?.role);
  
  if (!req.session.user || req.session.user.role !== "admin") {
    console.log('❌ Доступ запрещен - редирект на /login.html');
    return res.redirect("/login.html");
  }
  
  console.log('✅ Доступ разрешен');
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* ===============================
   404
=============================== */
app.use((req, res) => {
  res.status(404).send("Страница не найдена");
});

/* ===============================
   Start server
=============================== */
const PORT = 3000;
app.listen(PORT, () => {
  console.log('📂 Доступные страницы:');
  console.log('   • http://localhost:3000/login.html');
  console.log('   • http://localhost:3000/home.html');
  console.log('   • http://localhost:3000/catalog.html');
  console.log('   • http://localhost:3000/product.html');
  console.log('   • http://localhost:3000/profile.html');
  console.log('   • http://localhost:3000/admin.html (только admin)');
});