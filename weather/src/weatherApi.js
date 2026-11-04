const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
  });
  const response = await fetch(`${FORECAST_URL}?${params}`);

  if (!response.ok)
    throw new Error("The forecast service is unavailable right now.");

  return response.json();
}

export async function searchCity(query) {
  const params = new URLSearchParams({
    name: query,
    count: "1",
    language: "en",
    format: "json",
  });
  const response = await fetch(`${GEOCODING_URL}?${params}`);

  if (!response.ok) throw new Error("Could not search for that place.");

  const { results } = await response.json();
  if (!results?.length)
    throw new Error(`No places found for “${query}”. Try another city.`);

  return results[0];
}
