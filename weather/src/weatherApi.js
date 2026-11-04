const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

async function fetchJson(url, service) {
  const response = await fetch(url);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`${service} returned an invalid response.`);
  }

  if (!response.ok) {
    throw new Error(data.reason || `${service} is unavailable.`);
  }
  if (data.error) {
    throw new Error(data.reason || `${service} is unavailable.`);
  }
  return data;
}

function localDateTime(timestamp, timezoneOffset) {
  return new Date((timestamp + timezoneOffset) * 1000)
    .toISOString()
    .slice(0, 16);
}

function localTimeToTimestamp(value, timezoneOffset) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 1000 - timezoneOffset;
}

function normalizeForecast(data) {
  const timezoneOffset = data.utc_offset_seconds;
  const current = {
    time: data.current.time,
    temperature_2m: data.current.temperature_2m,
    apparent_temperature: data.current.apparent_temperature,
    relative_humidity_2m: data.current.relative_humidity_2m,
    wind_speed_10m: data.current.wind_speed_10m,
    weather_code: data.current.weather_code,
    cloud_cover: data.current.cloud_cover,
  };

  return {
    current,
    hourly: {
      time: data.hourly.time,
      temperature_2m: data.hourly.temperature_2m,
      precipitation_probability: data.hourly.precipitation_probability,
      weather_code: data.hourly.weather_code,
    },
    daily: {
      time: data.daily.time,
      temperature_2m_min: data.daily.temperature_2m_min,
      temperature_2m_max: data.daily.temperature_2m_max,
      precipitation_probability_max: data.daily.precipitation_probability_max,
      weather_code: data.daily.weather_code,
      sunrise: data.daily.sunrise.map((time) =>
        localTimeToTimestamp(time, timezoneOffset),
      ),
      sunset: data.daily.sunset.map((time) =>
        localTimeToTimestamp(time, timezoneOffset),
      ),
    },
    timezone_offset: timezoneOffset,
  };
}

export async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily:
      "weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "5",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
  });
  const data = await fetchJson(
    `${FORECAST_URL}?${params}`,
    "The weather service",
  );

  return normalizeForecast(data);
}

export async function searchCity(query) {
  const params = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json",
  });
  const data = await fetchJson(
    `${GEOCODING_URL}?${params}`,
    "City search",
  );
  const place = data.results?.[0];
  if (!place) {
    throw new Error("No weather data found for that place.");
  }

  return {
    name: place.name,
    admin1: place.admin1,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}
