(() => {
  const API_KEY = "f0d6a0da789f48808a6123315263005";

  const bgA = document.getElementById("bg-a");
  const bgB = document.getElementById("bg-b");
  let activeBg = bgA || bgB || null;

  function crossfadeTo(url) {
    if (!bgA || !bgB || !activeBg) return;
    const incoming = activeBg === bgA ? bgB : bgA;
    incoming.style.backgroundImage = `url("${url}")`;
    incoming.classList.add("active");
    activeBg.classList.remove("active");
    activeBg = incoming;
  }

  function pickBackgroundFromCondition(condText) {
    const t = (condText || "").toLowerCase();
    if (/thunder|storm|lightning/.test(t)) return "images/дощ.jpg";
    if (/rain|drizzle|shower|spray/.test(t)) return "images/дощ.jpg";
    if (/snow|sleet|blizzard|ice/.test(t)) return "images/сніг.jpg";
    if (/mist|fog|haze|smoke/.test(t)) return "images/туман.jpg";
    if (/dust|sand/.test(t)) return "images/засуха.jpg";
    if (/clear|sunny/.test(t)) return "images/сонячно.jpg";
    if (/cloud|overcast/.test(t)) return "images/хмарно.jpg";
    return "images/images (4).png";
  }

  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const result = document.getElementById("weather-result");

  async function fetchWeather(q) {
    if (!result) return;
    result.innerHTML = "<p>Завантаження...</p>";
    try {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(q)}&days=10&aqi=no&alerts=no`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || "API error");
      renderWeather(data);
      try {
        const cond =
          data.current && data.current.condition && data.current.condition.text;
        const bg = pickBackgroundFromCondition(cond);
        crossfadeTo(bg);
      } catch (e) {
      }
    } catch (err) {
      result.innerHTML = `<div class="error">Помилка: ${err.message}</div>`;
    }
  }

  function renderWeather(data) {
    if (!result || !data || !data.current) return;
    const icon =
      data.current.condition && data.current.condition.icon
        ? data.current.condition.icon.startsWith("//")
          ? "https:" + data.current.condition.icon
          : data.current.condition.icon
        : "";

    let html = `
      <div class="weather-card">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${icon}" alt="${data.current.condition.text}" width="64" height="64" />
            <div>
              <div style="font-weight:700;font-size:18px">${data.location.name}, ${data.location.country}</div>
              <div style="color:#555">${data.current.condition.text}</div>
            </div>
          </div>
          <div style="font-size:24px;font-weight:700">${data.current.temp_c}°C</div>
        </div>
        <div style="margin-top:10px;color:#333">Відчувається як ${data.current.feelslike_c}°C · Вологість ${data.current.humidity}% · Вітер ${data.current.wind_kph} км/год</div>
        <div style="margin-top:8px;color:#666;font-size:13px">Оновлено: ${data.current.last_updated}</div>
      </div>
    `;

    if (data.forecast && Array.isArray(data.forecast.forecastday)) {
      html += `<div class="forecast-grid">`;
      data.forecast.forecastday.forEach((day) => {
        const dIcon =
          day.day.condition && day.day.condition.icon
            ? day.day.condition.icon.startsWith("//")
              ? "https:" + day.day.condition.icon
              : day.day.condition.icon
            : "";
        const dateStr = new Date(day.date).toLocaleDateString("uk-UA", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        html += `
          <div class="forecast-item">
            <div class="date">${dateStr}</div>
            <img src="${dIcon}" alt="${day.day.condition.text}" width="48" height="48" />
            <div class="meta">${day.day.condition.text}</div>
            <div class="temps">${day.day.maxtemp_c}° / ${day.day.mintemp_c}°C</div>
            <div class="meta">Осадок: ${day.day.totalprecip_mm} мм · Вологість: ${day.day.avghumidity}%</div>
          </div>
        `;
      });
      html += `</div>`;
    }

    result.innerHTML = html;
  }

  if (searchBtn && cityInput) {
    searchBtn.addEventListener("click", () => {
      const q = cityInput.value.trim();
      if (!q) {
        if (result)
          result.innerHTML = '<div class="error">Введіть назву міста</div>';
        return;
      }
      if (q.toLowerCase() === "zov") {
        if (result) result.innerHTML = "";
        crossfadeTo("images/гав.jpg");
        return;
      }
      fetchWeather(q);
    });

    cityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchBtn.click();
    });
  }

  const params = new URLSearchParams(location.search);
  if (params.get("city") && cityInput) {
    cityInput.value = params.get("city");
    const initial = params.get("city").trim();
    if (initial.toLowerCase() === "zov") {
      crossfadeTo("images/гав.jpg");
    } else {
      fetchWeather(initial);
    }
  }

  const themeToggle = document.getElementById("theme-toggle");
  function updateThemeButton(isDark) {
    if (!themeToggle) return;
    themeToggle.textContent = isDark ? "Світла тема" : "Темна тема";
    themeToggle.setAttribute("aria-pressed", String(!!isDark));
  }
  function applyTheme(name) {
    if (name === "dark") document.body.classList.add("theme-dark");
    else document.body.classList.remove("theme-dark");
    updateThemeButton(name === "dark");
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("theme-dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeButton(isDark);
    });
  }
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) applyTheme(savedTheme);
  else {
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  const regEmail = document.getElementById("reg-email");
  const regName = document.getElementById("reg-name");
  const regPassword = document.getElementById("reg-password");
  const regPassword2 = document.getElementById("reg-password2");
  const regBtn = document.getElementById("reg-btn");
  const regMsg = document.getElementById("reg-msg");
  const authArea = document.getElementById("auth-area");
  const appArea = document.getElementById("app-area");
  const logoutBtn = document.getElementById("logout-btn");

  function showApp() {
    if (authArea) authArea.style.display = "none";
    if (appArea) appArea.hidden = false;
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const heading = document.getElementById("text1");
        if (heading)
          heading.textContent = `Прогноз погоди — ${user.name || user.email}`;
      } catch (e) {}
    }
  }

  function showAuth() {
    if (authArea) authArea.style.display = "";
    if (appArea) appArea.hidden = true;
    const heading = document.getElementById("text1");
    if (heading) heading.textContent = "Прогноз погоди";
  }

  function setUser(data) {
    localStorage.setItem("user", JSON.stringify(data));
    showApp();
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      showAuth();
    });
  }

  const storedUser = localStorage.getItem("user");
  if (storedUser) showApp();
  else showAuth();

  if (regBtn) {
    regBtn.addEventListener("click", async () => {
      if (!regEmail.value || !regPassword.value) {
        if (regMsg) regMsg.textContent = "Введіть email і пароль";
        if (regMsg) regMsg.className = "error";
        return;
      }
      if (regPassword.value !== regPassword2.value) {
        if (regMsg) regMsg.textContent = "Паролі не співпадають";
        if (regMsg) regMsg.className = "error";
        return;
      }
      regBtn.disabled = true;
      regBtn.textContent = "Реєстрація...";
      if (regMsg) regMsg.textContent = "";
      try {
        const resp = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: regEmail.value.trim(),
            password: regPassword.value,
            name: regName.value.trim(),
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          if (regMsg)
            regMsg.textContent =
              data && data.error ? data.error : "Помилка реєстрації";
          if (regMsg) regMsg.className = "error";
        } else {
          if (regMsg) regMsg.textContent = "Реєстрація успішна";
          if (regMsg) regMsg.className = "success";
          const userObj = {
            id: data.id,
            email: data.email,
            name: regName.value.trim() || data.name,
          };
          setUser(userObj);
          regEmail.value =
            regName.value =
            regPassword.value =
            regPassword2.value =
              "";
        }
      } catch (e) {
        if (regMsg) regMsg.textContent = "Помилка мережі";
        if (regMsg) regMsg.className = "error";
      } finally {
        regBtn.disabled = false;
        regBtn.textContent = "Зареєструватися";
      }
    });
    [regEmail, regPassword2].forEach((el) => {
      if (el)
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter") regBtn.click();
        });
    });
  }

  const loginBtn = document.getElementById("login-btn");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginMsg = document.getElementById("login-msg");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      if (!loginEmail.value || !loginPassword.value) {
        if (loginMsg) loginMsg.textContent = "Введіть email і пароль";
        if (loginMsg) loginMsg.className = "error";
        return;
      }
      loginBtn.disabled = true;
      loginBtn.textContent = "Увійти...";
      try {
        const resp = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loginEmail.value.trim(),
            password: loginPassword.value,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          if (loginMsg)
            loginMsg.textContent =
              data && data.error ? data.error : "Помилка входу";
          if (loginMsg) loginMsg.className = "error";
        } else {
          localStorage.setItem(
            "user",
            JSON.stringify({ id: data.id, email: data.email, name: data.name }),
          );
          window.location.href = "index.html";
        }
      } catch (e) {
        if (loginMsg) loginMsg.textContent = "Помилка мережі";
        if (loginMsg) loginMsg.className = "error";
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Увійти";
      }
    });
  }
})();
