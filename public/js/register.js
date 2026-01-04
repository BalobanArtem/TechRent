const form = document.getElementById("registerForm");
const successMessage = document.getElementById("successMessage");
const errorMessage = document.getElementById("errorMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Скрыть предыдущие ошибки
  errorMessage.classList.add("hidden");
  errorMessage.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());

  // Проверка длины пароля
  if (data.password.length < 6) {
    showError("Пароль должен содержать минимум 6 символов");
    return;
  }

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    // ❌ Ошибка
    if (!response.ok) {
      showError(result.message || "Ошибка регистрации");
      return;
    }

    // ✅ УСПЕХ
    form.classList.add("hidden");
    successMessage.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 5000);

  } catch (err) {
    console.error("❌ Fetch error:", err);
    showError("Ошибка соединения с сервером");
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  errorMessage.classList.add("shake");

  // Убрать shake после анимации
  setTimeout(() => {
    errorMessage.classList.remove("shake");
  }, 400);
}