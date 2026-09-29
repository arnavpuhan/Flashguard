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
    rainfall: 25,
    soilMoisture: 40,
    waterLevel: 25,
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

/* ---------------- RISK CALCULATION ---------------- */

function calculateRisk(
  rainfall,
  soilMoisture,
  waterLevel,
  slope
) {
  const rainfallScore =
    Math.min((rainfall / 120) * 100, 100);

  const soilScore =
    Math.min(soilMoisture, 100);

  const waterScore =
    Math.min((waterLevel / 80) * 100, 100);

  const slopeScore =
    Math.min((slope / 40) * 100, 100);

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

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.json({
    message: "FLASHGUARD API is running",
    system: "Flash Flood Early Warning System",
    mode: "Simulated Live Monitoring",
  });
});

/* ---------------- CONTROLLED DEMO ---------------- */

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

  /*
    Controlled hackathon demonstration.

    Each click moves Village C through:
    NORMAL → MODERATE → HIGH → CRITICAL
  */

  if (!village.demoStage) {
    village.demoStage = 0;
  }

  village.demoStage += 1;

  if (village.demoStage > 4) {
    village.demoStage = 4;
  }

  const stages = {
    1: {
      rainfall: 35,
      soilMoisture: 48,
      waterLevel: 30,
    },

    2: {
      rainfall: 70,
      soilMoisture: 62,
      waterLevel: 46,
    },

    3: {
      rainfall: 105,
      soilMoisture: 78,
      waterLevel: 62,
    },

    4: {
      rainfall: 145,
      soilMoisture: 94,
      waterLevel: 78,
    },
  };

  const stage = stages[village.demoStage];

  village.rainfall = stage.rainfall;
  village.soilMoisture = stage.soilMoisture;
  village.waterLevel = stage.waterLevel;

  const risk = calculateRisk(
    village.rainfall,
    village.soilMoisture,
    village.waterLevel,
    village.slope
  );

  const status = getStatus(risk);

  res.json({
    message: "Flood simulation stage applied",

    demoMode: true,

    stage: village.demoStage,

    totalStages: 4,

    stageName:
      status === "LOW"
        ? "NORMAL"
        : status,

    village: {
      ...village,
      risk,
      status,
    },
  });
});

/* ---------------- RESET DEMO ---------------- */

app.post("/api/demo/reset", (req, res) => {
  const village = villages.find(
    (village) => village.id === 3
  );

  if (!village) {
    return res.status(404).json({
      error: "Village not found",
    });
  }

  village.demoStage = 0;

  village.rainfall = 25;
  village.soilMoisture = 40;
  village.waterLevel = 25;

  const risk = calculateRisk(
    village.rainfall,
    village.soilMoisture,
    village.waterLevel,
    village.slope
  );

  res.json({
    message: "Flood demo reset",

    demoMode: false,

    village: {
      ...village,
      risk,
      status: getStatus(risk),
    },
  });
});

/* ---------------- ALL VILLAGES ---------------- */

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

/* ---------------- ONE VILLAGE ---------------- */

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

/* ---------------- HEALTH ---------------- */

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "FLASHGUARD",
    timestamp: new Date().toISOString(),
    monitoredRegions: villages.length,
    updateInterval: "5 seconds",
  });
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `FLASHGUARD backend running on port ${PORT}`
  );
});