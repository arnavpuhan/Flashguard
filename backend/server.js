const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Simulated village sensor data
const villages = [
  {
    id: 1,
    name: "Village A",
    lat: 30.0668,
    lng: 78.2676,
    rainfall: 32,
    soilMoisture: 45,
    waterLevel: 28,
    slope: 12,
  },
  {
    id: 2,
    name: "Village B",
    lat: 30.0805,
    lng: 78.2901,
    rainfall: 68,
    soilMoisture: 61,
    waterLevel: 45,
    slope: 19,
  },
  {
    id: 3,
    name: "Village C",
    lat: 30.0915,
    lng: 78.3102,
    rainfall: 118,
    soilMoisture: 86,
    waterLevel: 72,
    slope: 34,
  },
  {
    id: 4,
    name: "Village D",
    lat: 30.0552,
    lng: 78.3015,
    rainfall: 91,
    soilMoisture: 73,
    waterLevel: 58,
    slope: 27,
  },
];

// Simulate changing sensor readings
function simulateSensorChanges() {
  villages.forEach((village) => {
    village.rainfall += Math.floor(Math.random() * 7) - 3;
    village.soilMoisture += Math.floor(Math.random() * 5) - 2;
    village.waterLevel += Math.floor(Math.random() * 5) - 2;

    village.rainfall = Math.max(
      0,
      Math.min(village.rainfall, 150)
    );

    village.soilMoisture = Math.max(
      0,
      Math.min(village.soilMoisture, 100)
    );

    village.waterLevel = Math.max(
      0,
      Math.min(village.waterLevel, 80)
    );
  });

  console.log("Live sensor data updated");
}

// Update simulated sensor data every 5 seconds
setInterval(simulateSensorChanges, 5000);

// Calculate flood risk
function calculateRisk(
  rainfall,
  soilMoisture,
  waterLevel,
  slope
) {
  const rainfallScore = Math.min(
    (rainfall / 120) * 100,
    100
  );

  const soilScore = Math.min(
    soilMoisture,
    100
  );

  const waterScore = Math.min(
    (waterLevel / 80) * 100,
    100
  );

  const slopeScore = Math.min(
    (slope / 40) * 100,
    100
  );

  const risk =
    rainfallScore * 0.35 +
    soilScore * 0.25 +
    waterScore * 0.25 +
    slopeScore * 0.15;

  return Math.round(risk);
}

// Convert risk score into status
function getStatus(risk) {
  if (risk <= 30) {
    return "LOW";
  }

  if (risk <= 60) {
    return "MODERATE";
  }

  if (risk <= 80) {
    return "HIGH";
  }

  return "CRITICAL";
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "FLASHGUARD API is running",
  });
});

// Get all villages
app.get("/api/villages", (req, res) => {
  const result = villages.map((village) => {
    const risk = calculateRisk(
      village.rainfall,
      village.soilMoisture,
      village.waterLevel,
      village.slope
    );

    return {
      ...village,
      risk,
      status: getStatus(risk),
    };
  });

  res.json(result);
});

// Get a single village
app.get("/api/villages/:id", (req, res) => {
  const id = Number(req.params.id);

  const village = villages.find(
    (village) => village.id === id
  );

  if (!village) {
    return res.status(404).json({
      error: "Village not found",
    });
  }

  const risk = calculateRisk(
    village.rainfall,
    village.soilMoisture,
    village.waterLevel,
    village.slope
  );

  res.json({
    ...village,
    risk,
    status: getStatus(risk),
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `FLASHGUARD backend running on http://localhost:${PORT}`
  );
});