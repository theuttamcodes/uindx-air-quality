const $ = (id) => document.getElementById(id);

const form = $("searchForm");
const input = $("citySearch");
const loading = $("loading");
const error = $("errorMessage");

// AQI status
function getStatus(aqi) {
  if (aqi <= 50) return ["Good", "#42d392"];
  if (aqi <= 100) return ["Satisfactory", "#f5c542"];
  if (aqi <= 200) return ["Moderate", "#f59e42"];
  if (aqi <= 300) return ["Poor", "#ff7043"];
  if (aqi <= 400) return ["Very Poor", "#d94f8a"];
  return ["Severe", "#9b59b6"];
}

// AQI calculate karna
function calculate(value, ranges) {
  for (let r of ranges) {
    if (value >= r[0] && value <= r[1]) {
      return Math.round(
        r[2] + ((value - r[0]) * (r[3] - r[2])) / (r[1] - r[0]),
      );
    }
  }

  return 500;
}

// CPCB-style breakpoints
const pm25 = [
  [0, 30, 0, 50],
  [31, 60, 51, 100],
  [61, 90, 101, 200],
  [91, 120, 201, 300],
  [121, 250, 301, 400],
  [251, 500, 401, 500],
];

const pm10 = [
  [0, 50, 0, 50],
  [51, 100, 51, 100],
  [101, 250, 101, 200],
  [251, 350, 201, 300],
  [351, 430, 301, 400],
  [431, 1000, 401, 500],
];

const no2 = [
  [0, 40, 0, 50],
  [41, 80, 51, 100],
  [81, 180, 101, 200],
  [181, 280, 201, 300],
  [281, 400, 301, 400],
  [401, 800, 401, 500],
];

const so2 = [
  [0, 40, 0, 50],
  [41, 80, 51, 100],
  [81, 380, 101, 200],
  [381, 800, 201, 300],
  [801, 1600, 301, 400],
  [1601, 2000, 401, 500],
];

const o3 = [
  [0, 50, 0, 50],
  [51, 100, 51, 100],
  [101, 168, 101, 200],
  [169, 208, 201, 300],
  [209, 748, 301, 400],
  [749, 1000, 401, 500],
];

const co = [
  [0, 1, 0, 50],
  [1.1, 2, 51, 100],
  [2.1, 10, 101, 200],
  [10.1, 17, 201, 300],
  [17.1, 34, 301, 400],
  [34.1, 50, 401, 500],
];

// City search
async function searchCity(city) {
  loading.style.display = "block";
  error.style.display = "none";

  try {
    // City location
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`,
    );

    const location = await geo.json();

    if (!location.results) throw new Error("City not found");

    const place = location.results[0];

    // Pollution data
    const response = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.latitude}&longitude=${place.longitude}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide&timezone=auto`,
    );

    const air = await response.json();
    const d = air.current;

    // Har pollutant ka AQI
    let results = [];

    if (d.pm2_5 != null) results.push(["PM2.5", calculate(d.pm2_5, pm25)]);

    if (d.pm10 != null) results.push(["PM10", calculate(d.pm10, pm10)]);

    if (d.nitrogen_dioxide != null)
      results.push(["NO₂", calculate(d.nitrogen_dioxide, no2)]);

    if (d.sulphur_dioxide != null)
      results.push(["SO₂", calculate(d.sulphur_dioxide, so2)]);

    if (d.ozone != null) results.push(["O₃", calculate(d.ozone, o3)]);

    if (d.carbon_monoxide != null)
      results.push(["CO", calculate(d.carbon_monoxide / 1000, co)]);

    // Sabse bada sub-index = AQI
    results.sort((a, b) => b[1] - a[1]);

    const aqi = results[0][1];
    const pollutant = results[0][0];

    const [status, color] = getStatus(aqi);

    // Main AQI
    $("mainAqi").textContent = aqi;
    $("mainAqi").style.color = color;

    // Globe
    $("marker").textContent = aqi;
    $("marker").style.background = color;

    $("badge").textContent = aqi;
    $("badge").style.background = color;

    // Popup
    $("popupAqi").textContent = aqi;
    $("popupStatus").textContent = status;
    $("popup").style.background = color;

    // City
    $("location").textContent = `${place.name}, ${place.country_code}`;

    $("popupCity").textContent = `${place.name}, ${place.country}`;

    // Pollutant
    $("pollutant").textContent = pollutant;

    // Risk
    $("risk").textContent = Math.min(99, Math.round(aqi / 5)) + "%";

    $("risk").style.color = color;

    // Description
    $("riskDesc").textContent = "Current air quality: " + status;
  } catch (e) {
    error.textContent = "AQI data nahi mil raha. Please try again.";

    error.style.display = "block";
  }

  loading.style.display = "none";
}

// Search
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = input.value.trim();

  if (city) searchCity(city);
});

// Get Started
$("getStarted").onclick = () => {
  document.querySelector("#air-quality").scrollIntoView({
    behavior: "smooth",
  });

  input.focus();
};

// Details
$("detailsButton").onclick = () => {
  alert(
    "AQI: " +
      $("mainAqi").textContent +
      "\nStatus: " +
      $("popupStatus").textContent +
      "\nMain Pollutant: " +
      $("pollutant").textContent,
  );
};

// Globe
$("globeButton").onclick = () => {
  document.querySelector(".globe").classList.toggle("globe-active");
};

// Map
$("mapButton").onclick = () => {
  window.open("https://www.google.com/maps", "_blank");
};

// Date & time
function updateTime() {
  $("datetime").textContent = new Date().toLocaleString();
}

setInterval(updateTime, 1000);
updateTime();-+

// Default city
searchCity("Delhi");
