const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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

/*
  FLASHGUARD SIMULATED SENSOR ENGINE

  This prototype simulates incoming environmental
  sensor readings so the complete monitoring pipeline
  can be demonstrated during the hackathon.

  In a real deployment, this section can be replaced
  with actual IoT / weather / hydrological data.
*/

function simulateSensorChanges() {
  villages.forEach((village) => {
    village.rainfall += Math.floor(Math.random() * 7) - 3;

    village.soilMoisture +=
      Math.floor(Math.random() * 5) - 2;

    village.waterLevel +=
      Math.floor(Math.random() * 5) - 2;

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

  console.log(
    "FLASHGUARD: simulated sensor data updated"
  );
}

setInterval(simulateSensorChanges, 5000);

/*
  RISK CALCULATION

  Rainfall       = 35%
  Soil Moisture  = 25%
  Water Level    = 25%
  Terrain Slope = 15%
*/

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

/*
  ROOT API
*/

app.get("/", (req, res) => {
  res.json({
    message: "FLASHGUARD API is running",
    system: "Flash Flood Early Warning System",
    mode: "Simulated Live Monitoring",
  });
});
/*
  DEMO FLOOD SCENARIO

  This endpoint intentionally increases the
  environmental values of a selected village.

  It is ONLY for hackathon demonstration.
*/

app.post("/api/demo/flood", (req, res) => {
  const villageId = Number(req.body.villageId || 3);

  const village = villages.find(
    (village) => village.id === villageId
  );

  if (!village) {
    return res.status(404).json({
      error: "Village not found",
    });
  }

  village.rainfall = Math.min(
    village.rainfall + 15,
    150
  );

  village.soilMoisture = Math.min(
    village.soilMoisture + 5,
    100
  );

  village.waterLevel = Math.min(
    village.waterLevel + 7,
    80
  );

  const risk = calculateRisk(
    village.rainfall,
    village.soilMoisture,
    village.waterLevel,
    village.slope
  );

  res.json({
    message:
      "Demo flood scenario applied",
    demoMode: true,
    village: {
      ...village,
      risk,
      status: getStatus(risk),
    },
  });
});
/*
  GET ALL VILLAGES
*/

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

/*
  GET ONE VILLAGE
*/

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

/*
  SYSTEM HEALTH CHECK
*/

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "FLASHGUARD",
    timestamp: new Date().toISOString(),
    monitoredRegions: villages.length,
    updateInterval: "5 seconds",
  });
});

/*
  START SERVER
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `FLASHGUARD backend running on port ${PORT}`
  );
});