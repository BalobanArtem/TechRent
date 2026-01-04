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
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login.html");
  }
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
  console.log('╔══════════════════════════════════════╗');
  console.log('║                                      ║');
  console.log('║     🚀 TechRent Server Started      ║');
  console.log('║                                      ║');
  console.log(`║     📍 http://localhost:${PORT}        ║`);
  console.log('║                                      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('📂 Доступные страницы:');
  console.log('   • http://localhost:3000/login.html');
  console.log('   • http://localhost:3000/home.html');
  console.log('   • http://localhost:3000/catalog.html');
  console.log('   • http://localhost:3000/product.html');
  console.log('   • http://localhost:3000/profile.html');
  console.log('   • http://localhost:3000/admin.html (только admin)');
  console.log('');
  console.log('🔌 API endpoints:');
  console.log('   AUTH:');
  console.log('   • POST /login');
  console.log('   • POST /register');
  console.log('   • GET  /logout');
  console.log('   • GET  /api/profile');
  console.log('   • PUT  /api/profile/update');
  console.log('   • POST /api/profile/upload-photo');
  console.log('   • GET  /api/profile/statistics');
  console.log('   • GET  /api/auth/current-user');
  console.log('');
  console.log('   EQUIPMENT:');
  console.log('   • GET  /api/equipment');
  console.log('   • GET  /api/equipment/:id');
  console.log('   • GET  /api/brands');
  console.log('   • GET  /api/types');
  console.log('   • POST /api/rental');
  console.log('   • POST /api/purchase');
  console.log('   • GET  /api/user/:user_id/purchases');
  console.log('   • GET  /api/user/:user_id/rentals');
  console.log('');
});