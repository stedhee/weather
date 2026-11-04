import {
  formatDate,
  formatTemperature,
  getWeatherInfo,
  renderWeatherIcon,
} from "./weather.js";

function renderLoading() {
  return '<main class="loading"><span class="loading-mark"></span><p>Finding your forecast</p></main>';
}

function renderError(state) {
  return `<main class="error-screen"><span class="eyebrow">WEATHER, SIMPLY</span><h1>We lost the forecast.</h1><p>${state.error || "Check your connection and try again."}</p><button class="retry-button" id="retry">Try again</button></main>`;
}

function renderHeader(state) {
  return `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Weather home">
        <span class="brand-mark">${renderWeatherIcon(0)}</span>
        <span>weather<span class="brand-period">.</span></span>
      </a>
      <form class="search" id="search-form" role="search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>
        </svg>
        <input id="city-search" type="search" placeholder="Search a city..."
          aria-label="Search a city" autocomplete="off" value="${state.lastQuery || ""}" />
        <button type="submit" aria-label="Search">Enter</button>
      </form>
      <div class="top-actions">
        <button class="location-button" id="locate" title="Use my location"
          aria-label="Use my location">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/>
            <circle cx="12" cy="9" r="2.3"/>
          </svg>
        </button>
        <div class="unit-switch" aria-label="Temperature units">
          <button type="button" data-unit="C" class="${state.unit === "C" ? "selected" : ""}"
            aria-pressed="${state.unit === "C"}">°C</button>
          <button type="button" data-unit="F" class="${state.unit === "F" ? "selected" : ""}"
            aria-pressed="${state.unit === "F"}">°F</button>
        </div>
      </div>
    </header>
    ${state.error ? `<p class="search-error" role="alert">${state.error}</p>` : ""}`;
}

function renderHero(state, current, condition, today) {
  const location = [state.place.admin1, state.place.country]
    .filter(Boolean)
    .join(", ");

  return `
    <section class="weather-hero" aria-label="Current weather">
      <div class="hero-copy">
        <div class="eyebrow"><span class="live-dot"></span> RIGHT NOW
          <span class="eyebrow-divider">/</span> ${today.toUpperCase()}
        </div>
        <h1>${state.place.name}<span>${location}</span></h1>
        <p class="hero-condition">${condition}
          <span>Feels like ${formatTemperature(current.apparent_temperature, state.unit)}</span>
        </p>
      </div>
      <div class="hero-reading">
        <div class="hero-temp">${formatTemperature(current.temperature_2m, state.unit)}</div>
        ${renderWeatherIcon(current.weather_code, "hero-icon")}
      </div>
      <div class="hero-caption">A little weather, a lot of day.</div>
    </section>`;
}

function renderHourly(hourly, current, unit) {
  let start = hourly.time.findIndex(
    (time) => time.slice(0, 13) === current.time.slice(0, 13),
  );
  if (start < 0) {
    start = Math.max(
      0,
      hourly.time.findIndex((time) => time > current.time) - 1,
    );
  }

  const items = hourly.time.slice(start, start + 8).map((time, index) => {
    const temperature = hourly.temperature_2m[start + index];
    const rain = hourly.precipitation_probability[start + index] ?? 0;
    const code = hourly.weather_code[start + index];
    const label =
      index === 0
        ? "Now"
        : new Date(`${time.slice(0, 16)}:00Z`).toLocaleTimeString("en", {
            hour: "numeric",
            timeZone: "UTC",
          });

    return `
      <article class="hour-item ${index === 0 ? "hour-now" : ""}">
        <span class="hour-label">${label}</span>
        ${renderWeatherIcon(code, "hour-icon")}
        <strong>${formatTemperature(temperature, unit)}</strong>
        <span class="rain-chance">${rain}% <i>rain</i></span>
      </article>`;
  });

  return `
    <section class="section hourly-section" aria-labelledby="hourly-heading">
      <div class="section-heading">
        <div><span class="section-index">01</span><h2 id="hourly-heading">The next hours</h2></div>
        <span class="section-note">LOCAL TIME</span>
      </div>
      <div class="hourly-strip">${items.join("")}</div>
    </section>`;
}

function renderWeek(daily, unit) {
  const days = daily.time.map((date, index) => {
    const [label] = getWeatherInfo(daily.weather_code[index]);
    const min = daily.temperature_2m_min[index];
    const max = daily.temperature_2m_max[index];
    const rain = daily.precipitation_probability_max[index] ?? 0;
    const dayName =
      index === 0 ? "Today" : formatDate(date, { weekday: "short" });
    const rangeStart = Math.max(0, (min + 10) * 2);
    const rangeWidth = Math.max(14, (max - min) * 2);

    return `
      <article class="day-row">
        <span class="day-name">${dayName}</span>
        ${renderWeatherIcon(daily.weather_code[index], "day-icon")}
        <span class="day-condition">${label}</span>
        <span class="day-rain">${rain}%</span>
        <div class="day-range">
          <span>${formatTemperature(min, unit)}</span>
          <div class="range-track"><i style="--range-start:${rangeStart}%;--range-width:${rangeWidth}%"></i></div>
          <strong>${formatTemperature(max, unit)}</strong>
        </div>
      </article>`;
  });

  return `
    <section class="section week-section" aria-labelledby="week-heading">
      <div class="section-heading">
        <div><span class="section-index">02</span><h2 id="week-heading">This week</h2></div>
        <span class="section-note">5 DAY OUTLOOK</span>
      </div>
      <div class="week-list">${days.join("")}</div>
    </section>`;
}

function renderDetails(current, daily, timezoneOffset) {
  const cityTime = (timestamp) =>
    new Date((timestamp + timezoneOffset) * 1000).toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  const sunrise = cityTime(daily.sunrise[0]);
  const sunset = cityTime(daily.sunset[0]);
  const cloudCover = current.cloud_cover;

  return `
    <aside class="section details-section" aria-labelledby="details-heading">
      <div class="section-heading">
        <div><span class="section-index">03</span><h2 id="details-heading">At a glance</h2></div>
      </div>
      <div class="detail-list">
        <div class="detail-item">
          <span class="detail-symbol humidity-symbol">%</span>
          <div><span class="detail-label">Humidity</span><strong>${current.relative_humidity_2m}<small>%</small></strong></div>
          <span class="detail-foot">${current.relative_humidity_2m > 70 ? "A little muggy" : "Feels comfortable"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-symbol wind-symbol">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 8h12a3 3 0 1 0-3-3M3 12h17a2 2 0 1 1-2 2M3 16h10a3 3 0 1 1-3 3"/>
            </svg>
          </span>
          <div><span class="detail-label">Wind</span><strong>${Math.round(current.wind_speed_10m)}<small> km/h</small></strong></div>
          <span class="detail-foot">Steady breeze</span>
        </div>
        <div class="detail-item">
          <span class="detail-symbol cloud-symbol">CL</span>
          <div><span class="detail-label">Cloud cover</span><strong>${cloudCover}<small>%</small></strong></div>
          <span class="detail-foot">${cloudCover >= 70 ? "Mostly cloudy" : "Some clear skies"}</span>
        </div>
        <div class="sun-times">
          <div><span class="sunrise-icon">↗</span><span>Sunrise<strong>${sunrise}</strong></span></div>
          <div><span class="sunset-icon">↘</span><span>Sunset<strong>${sunset}</strong></span></div>
        </div>
      </div>
    </aside>`;
}

function bindEvents(state, handlers) {
  document.querySelector("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = document.querySelector("#city-search").value.trim();
    if (query) handlers.onSearch(query);
  });

  document.querySelectorAll("[data-unit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.unit = button.dataset.unit;
      handlers.onRender();
    });
  });

  document.querySelector("#locate").addEventListener("click", handlers.onLocate);
}

export function renderDashboard(app, state, handlers) {
  if (state.loading && !state.forecast) {
    app.innerHTML = renderLoading();
    return;
  }

  if (!state.forecast) {
    app.innerHTML = renderError(state);
    document
      .querySelector("#retry")
      .addEventListener("click", handlers.onRetry);
    return;
  }

  const { current, hourly, daily } = state.forecast;
  const [condition] = getWeatherInfo(current.weather_code);
  const today = formatDate(current.time.slice(0, 10), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  app.innerHTML = `
    <div class="app-shell">
      ${renderHeader(state)}
      <main>
        ${renderHero(state, current, condition, today)}
        ${renderHourly(hourly, current, state.unit)}
        <section class="lower-grid">
          ${renderWeek(daily, state.unit)}
          ${renderDetails(current, daily, state.forecast.timezone_offset)}
        </section>
      </main>
      <footer>
        <span>FORECAST FOR ${state.place.name.toUpperCase()}</span>
        <span>Weather data by <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">OpenWeatherMap</a></span>
      </footer>
      ${state.loading ? '<div class="refreshing" role="status">Updating forecast...</div>' : ""}
    </div>`;

  bindEvents(state, handlers);
}
