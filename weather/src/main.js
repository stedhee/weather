import "./dashboard.css";
import { renderDashboard } from "./dashboard.js";
import { fetchForecast, searchCity } from "./weatherApi.js";

const app = document.querySelector("#app");
const state = {
  unit: "C",
  place: null,
  forecast: null,
  loading: true,
};

function render() {
  renderDashboard(app, state, {
    onRender: render,
    onSearch: loadCity,
    onLocate: locateUser,
    onRetry: () => loadCity(state.lastQuery || "London"),
  });
}

function getErrorMessage(error, service) {
  if (error instanceof TypeError) {
    return `Unable to reach ${service}. Check your internet connection and try again.`;
  }
  return error.message || "Check your connection and try again.";
}

async function loadCoordinates(latitude, longitude, place) {
  state.loading = true;
  state.error = "";
  render();

  try {
    state.forecast = await fetchForecast(latitude, longitude);
    state.place = place;
  } catch (error) {
    state.error = getErrorMessage(error, "the weather service");
  } finally {
    state.loading = false;
    render();
  }
}

async function loadCity(query) {
  state.lastQuery = query;
  state.loading = true;
  state.error = "";
  render();

  try {
    const place = await searchCity(query);
    await loadCoordinates(place.latitude, place.longitude, place);
  } catch (error) {
    state.error = getErrorMessage(error, "city search");
    state.loading = false;
    render();
  }
}

function locateUser() {
  if (!navigator.geolocation) {
    state.error = "Location is not available in this browser.";
    render();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) =>
      loadCoordinates(coords.latitude, coords.longitude, {
        name: "Your location",
        country: "",
      }),
    () => {
      state.error =
        "Location permission was not available. Search for a city instead.";
      render();
    },
    { timeout: 10000 },
  );
}

render();
loadCity("London");
