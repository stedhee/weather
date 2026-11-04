const API_URL = "https://api.openweathermap.org/data/2.5";
const API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

function requireApiKey() {
  if (!API_KEY || API_KEY === "YOUR_KEY") {
    throw new Error(
      "Add your OpenWeatherMap API key to weather/.env.local, then restart the app.",
    );
  }
}

async function getWeatherData(endpoint, params) {
  requireApiKey();
  params.set("appid", API_KEY);
  const response = await fetch(`${API_URL}/${endpoint}?${params}`);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "OpenWeatherMap rejected the API key. Check that it is correct and active.",
      );
    }
    if (response.status === 404) {
      throw new Error("No weather data found for that place.");
    }
    throw new Error(data.message || "The weather service is unavailable.");
  }

  return data;
}

function toWeatherCode(id) {
  if (id >= 200 && id < 300) return 95;
  if (id >= 300 && id < 400) return 51;
  if (id === 511) return 66;
  if (id >= 500 && id < 600) return id >= 502 ? 65 : 61;
  if (id >= 600 && id < 700) return id >= 620 ? 85 : 71;
  if (id >= 700 && id < 800) return 45;
  if (id === 800) return 0;
  if (id <= 802) return id === 801 ? 1 : 2;
  return 3;
}

function localDateTime(timestamp, timezoneOffset) {
  return new Date((timestamp + timezoneOffset) * 1000)
    .toISOString()
    .slice(0, 16);
}

function normalizeForecast(currentData, forecastData) {
  const timezoneOffset = currentData.timezone;
  const currentWeather = currentData.weather[0];
  const current = {
    time: localDateTime(currentData.dt, timezoneOffset),
    temperature_2m: currentData.main.temp,
    apparent_temperature: currentData.main.feels_like,
    relative_humidity_2m: currentData.main.humidity,
    wind_speed_10m: currentData.wind.speed * 3.6,
    weather_code: toWeatherCode(currentWeather.id),
    cloud_cover: currentData.clouds.all,
  };
  const hourlyEntries = forecastData.list.map((entry) => ({
    time: localDateTime(entry.dt, timezoneOffset),
    temperature: entry.main.temp,
    rain: Math.round((entry.pop || 0) * 100),
    code: toWeatherCode(entry.weather[0].id),
  }));
  const days = new Map();

  function addToDay(date, entry) {
    if (!days.has(date)) {
      days.set(date, {
        time: date,
        temperatures: [],
        rain: 0,
        middayDistance: Infinity,
        weatherCode: entry.code,
      });
    }

    const day = days.get(date);
    day.temperatures.push(entry.temperature);
    day.rain = Math.max(day.rain, entry.rain);

    const hour = Number(entry.time.slice(11, 13));
    const distanceFromMidday = Math.abs(hour - 12);
    if (distanceFromMidday < day.middayDistance) {
      day.middayDistance = distanceFromMidday;
      day.weatherCode = entry.code;
    }
  }

  addToDay(current.time.slice(0, 10), {
    time: current.time,
    temperature: current.temperature_2m,
    rain: 0,
    code: current.weather_code,
  });
  hourlyEntries.forEach((entry) =>
    addToDay(entry.time.slice(0, 10), entry),
  );

  const dailyEntries = Array.from(days.values()).slice(0, 5);
  const daily = {
    time: dailyEntries.map((day) => day.time),
    temperature_2m_min: dailyEntries.map((day) =>
      Math.min(...day.temperatures),
    ),
    temperature_2m_max: dailyEntries.map((day) =>
      Math.max(...day.temperatures),
    ),
    precipitation_probability_max: dailyEntries.map((day) => day.rain),
    weather_code: dailyEntries.map((day) => day.weatherCode),
    sunrise: [currentData.sys.sunrise],
    sunset: [currentData.sys.sunset],
  };

  return {
    current,
    hourly: {
      time: hourlyEntries.map((entry) => entry.time),
      temperature_2m: hourlyEntries.map((entry) => entry.temperature),
      precipitation_probability: hourlyEntries.map((entry) => entry.rain),
      weather_code: hourlyEntries.map((entry) => entry.code),
    },
    daily,
    timezone_offset: timezoneOffset,
  };
}

export async function fetchForecast(latitude, longitude) {
  const currentParams = new URLSearchParams({
    lat: latitude,
    lon: longitude,
    units: "metric",
  });
  const forecastParams = new URLSearchParams({
    lat: latitude,
    lon: longitude,
    units: "metric",
  });
  const [currentData, forecastData] = await Promise.all([
    getWeatherData("weather", currentParams),
    getWeatherData("forecast", forecastParams),
  ]);

  return normalizeForecast(currentData, forecastData);
}

export async function searchCity(query) {
  const params = new URLSearchParams({ q: query });
  const data = await getWeatherData("weather", params);

  return {
    name: data.name,
    country: data.sys.country,
    latitude: data.coord.lat,
    longitude: data.coord.lon,
  };
}
