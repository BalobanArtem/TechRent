const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

function showError(text) {
  errorMessage.textContent = text;
  errorMessage.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.classList.add("hidden");

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch("/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      showError(result.message || "Ошибка входа");
      return;
    }

    if (!result.redirect) {
      showError("Ошибка: сервер не вернул redirect");
      return;
    }

    // ✅ редирект строго по серверу
    window.location.href = result.redirect;

  } catch (err) {
    console.error(err);
    showError("Ошибка соединения с сервером");
  }
});