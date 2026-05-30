const API_KEY = "f0d6a0da789f48808a6123315263005";

const input = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const result = document.getElementById("weather-result");

async function fetchWeather(q) {
  result.innerHTML = "<p>Завантаження...</p>";
  try {
    const days = 10; 
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(q)}&days=${days}&aqi=no&alerts=no`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("HTTP error " + resp.status);
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || "API error");
    renderWeather(data);
  } catch (err) {
    result.innerHTML = `<div class="error">Помилка: ${err.message}</div>`;
  }
}

function renderWeather(data) {
  const icon = data.current.condition.icon.startsWith("//")
    ? "https:" + data.current.condition.icon
    : data.current.condition.icon;

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
    html += '<div class="forecast-grid">';
    data.forecast.forecastday.forEach((day) => {
      const dIcon = day.day.condition.icon.startsWith("//")
        ? "https:" + day.day.condition.icon
        : day.day.condition.icon;
      const chance =
        day.day.daily_chance_of_rain ?? day.day.daily_chance_of_rain ?? 0;
      html += `
        <div class="forecast-item">
          <div class="date">${day.date}</div>
          <img src="${dIcon}" alt="${day.day.condition.text}" width="54" height="54" />
          <div class="cond">${day.day.condition.text}</div>
          <div class="temps">Max ${day.day.maxtemp_c}° · Min ${day.day.mintemp_c}°</div>
          <div class="meta">Осадки: ${chance}% · Вологість: ${day.day.avghumidity}%</div>
        </div>
      `;
    });
    html += "</div>";
  }

  result.innerHTML = html;
}

searchBtn.addEventListener("click", () => {
  const q = input.value.trim();
  if (!q) {
    result.innerHTML = '<div class="error">Введіть назву міста</div>';
    return;
  }
  fetchWeather(q);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

const params = new URLSearchParams(location.search);
if (params.get("city")) {
  input.value = params.get("city");
  fetchWeather(params.get("city"));
}
