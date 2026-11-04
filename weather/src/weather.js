const weatherTypes = {
  0: ["Clear sky", "sun"],
  1: ["Mostly clear", "sun"],
  2: ["Partly cloudy", "partly"],
  3: ["Overcast", "cloud"],
  45: ["Foggy", "fog"],
  48: ["Rime fog", "fog"],
  51: ["Light drizzle", "rain"],
  53: ["Drizzle", "rain"],
  55: ["Heavy drizzle", "rain"],
  56: ["Freezing drizzle", "rain"],
  57: ["Freezing drizzle", "rain"],
  61: ["Light rain", "rain"],
  63: ["Rain", "rain"],
  65: ["Heavy rain", "rain"],
  66: ["Freezing rain", "rain"],
  67: ["Freezing rain", "rain"],
  71: ["Light snow", "snow"],
  73: ["Snow", "snow"],
  75: ["Heavy snow", "snow"],
  77: ["Snow grains", "snow"],
  80: ["Rain showers", "rain"],
  81: ["Rain showers", "rain"],
  82: ["Heavy showers", "rain"],
  85: ["Snow showers", "snow"],
  86: ["Heavy snow showers", "snow"],
  95: ["Thunderstorm", "storm"],
  96: ["Thunderstorm with hail", "storm"],
  99: ["Thunderstorm with hail", "storm"],
};

const weatherShapes = {
  sun: '<circle class="sun-core" cx="32" cy="32" r="12"/><path class="sun-rays" d="M32 5v7m0 40v7M5 32h7m40 0h7M13 13l5 5m28 28 5 5m0-38-5 5M18 46l-5 5"/>',
  partly:
    '<circle class="sun-core" cx="40" cy="21" r="10"/><path class="sun-rays" d="M40 5v4m0 24v4m-16-16h4m24 0h4m-27-11 3 3m18 18 3 3"/><path class="cloud-shape" d="M18 47h29a10 10 0 0 0 0-20 15 15 0 0 0-29-2 11 11 0 0 0 0 22Z"/>',
  cloud:
    '<path class="cloud-shape" d="M15 48h34a11 11 0 0 0 0-22h-1a17 17 0 0 0-33-3 12 12 0 0 0 0 25Z"/>',
  fog: '<path class="cloud-shape" d="M16 37h32a9 9 0 0 0 0-18h-1a14 14 0 0 0-27-2 10 10 0 0 0-4 20Z"/><path class="weather-line" d="M11 46h42M17 54h30"/>',
  rain: '<path class="cloud-shape" d="M15 37h34a11 11 0 0 0 0-22h-1a17 17 0 0 0-33-3 12 12 0 0 0 0 25Z"/><path class="weather-line" d="m22 44-3 8m17-8-3 8m17-8-3 8"/>',
  snow: '<path class="cloud-shape" d="M15 34h34a11 11 0 0 0 0-22h-1a17 17 0 0 0-33-3 12 12 0 0 0 0 25Z"/><path class="weather-line" d="M22 43v10m-4-5h8m12-5v10m-4-5h8m8-5v10m-4-5h8"/>',
  storm:
    '<path class="cloud-shape" d="M15 36h34a11 11 0 0 0 0-22h-1a17 17 0 0 0-33-3 12 12 0 0 0 0 25Z"/><path class="weather-line" d="m34 39-9 13h8l-2 9 12-16h-9l4-6"/>',
};

export function getWeatherInfo(code) {
  return weatherTypes[code] ?? ["Variable conditions", "cloud"];
}

export function renderWeatherIcon(code, extraClass = "") {
  const shape = weatherShapes[getWeatherInfo(code)[1]];
  return `<svg class="weather-icon ${extraClass}" viewBox="0 0 64 64" fill="none" aria-hidden="true">${shape}</svg>`;
}

export function formatTemperature(value, unit) {
  const temperature = unit === "C" ? value : (value * 9) / 5 + 32;
  return `${Math.round(temperature)}°`;
}

export function formatDate(date, options) {
  return new Intl.DateTimeFormat("en", options).format(
    new Date(`${date}T12:00:00`),
  );
}
