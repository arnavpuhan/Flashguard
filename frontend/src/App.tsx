import { useEffect, useState } from "react";
import MapView from "./MapView";
import type { Village, RiskFilter } from "./MapView";
import "./App.css";

function getStatusClass(status: Village["status"]) {
  switch (status) {
    case "CRITICAL":
      return "status-critical";
    case "HIGH":
      return "status-high";
    case "MODERATE":
      return "status-moderate";
    default:
      return "status-low";
  }
}

function getRiskMessage(status: Village["status"]) {
  switch (status) {
    case "CRITICAL":
      return "Immediate attention required. Prepare emergency response.";
    case "HIGH":
      return "High flood risk detected. Monitor the location closely.";
    case "MODERATE":
      return "Moderate risk detected. Continue monitoring sensor conditions.";
    default:
      return "Current conditions are within the normal monitoring range.";
  }
}

function getRiskFactor(value: number, max: number) {
  return Math.min(Math.round((value / max) * 100), 100);
}

function getTrend(history: number[]) {
  if (history.length < 2) {
    return "Collecting data";
  }

  const first = history[0];
  const latest = history[history.length - 1];

  if (latest > first + 2) {
    return "↑ Increasing";
  }

  if (latest < first - 2) {
    return "↓ Decreasing";
  }

  return "→ Stable";
}

function getTrendClass(history: number[]) {
  if (history.length < 2) {
    return "trend-neutral";
  }

  const first = history[0];
  const latest = history[history.length - 1];

  if (latest > first + 2) {
    return "trend-up";
  }

  if (latest < first - 2) {
    return "trend-down";
  }

  return "trend-neutral";
}

function App() {
  const [filter, setFilter] =
    useState<RiskFilter>("All Regions");

  const [villages, setVillages] =
    useState<Village[]>([]);

  const [selectedVillageId, setSelectedVillageId] =
    useState<number | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [backendConnected, setBackendConnected] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [riskHistory, setRiskHistory] =
    useState<number[]>([]);

  const [demoLoading, setDemoLoading] =
    useState(false);

  const [demoMessage, setDemoMessage] =
    useState("");

  const selectedVillage =
    villages.find(
      (village) =>
        village.id === selectedVillageId
    ) || null;

  /* ---------------- CLOCK ---------------- */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ---------------- RISK HISTORY ---------------- */

  useEffect(() => {
    if (!selectedVillage) {
      return;
    }

    setRiskHistory((previous) => {
      const latestRisk = selectedVillage.risk;

      if (
        previous.length > 0 &&
        previous[previous.length - 1] === latestRisk
      ) {
        return previous;
      }

      return [
        ...previous,
        latestRisk,
      ].slice(-12);
    });
  }, [selectedVillage]);

  /* ---------------- VILLAGE UPDATE ---------------- */

  const handleVillagesUpdate = (
    updatedVillages: Village[]
  ) => {
    setVillages(updatedVillages);
    setLastUpdated(new Date());
  };

  /* ---------------- VILLAGE SELECT ---------------- */

  const handleVillageSelect = (
    village: Village
  ) => {
    setSelectedVillageId(village.id);
    setRiskHistory([village.risk]);
    setShowDetails(true);
  };

  /* ---------------- BACKEND CONNECTION ---------------- */

  const handleConnectionChange = (
    connected: boolean
  ) => {
    setBackendConnected(connected);
  };

  /* ---------------- CONTROLLED FLOOD DEMO ---------------- */

  const runFloodDemo = async () => {
    try {
      setDemoLoading(true);
      setDemoMessage("");

      const response = await fetch(
        "https://flashguard-a72s.onrender.com/api/demo/flood",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            villageId: 3,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Demo request failed");
      }

      const data = await response.json();

      setDemoMessage(
        `Stage ${data.stage}/${data.totalStages} — ${data.village.name}: ${data.village.status} risk — ${data.village.risk}/100`
      );

      setSelectedVillageId(data.village.id);

      setRiskHistory((previous) =>
        [
          ...previous,
          data.village.risk,
        ].slice(-12)
      );

      setShowDetails(true);
    } catch (error) {
      console.error(error);

      setDemoMessage(
        "Unable to run flood simulation. Please check the backend."
      );
    } finally {
      setDemoLoading(false);
    }
  };

  /* ---------------- RISK COUNTS ---------------- */

  const criticalCount =
    villages.filter(
      (village) =>
        village.status === "CRITICAL"
    ).length;

  const highCount =
    villages.filter(
      (village) =>
        village.status === "HIGH"
    ).length;

  const moderateCount =
    villages.filter(
      (village) =>
        village.status === "MODERATE"
    ).length;

  const lowCount =
    villages.filter(
      (village) =>
        village.status === "LOW"
    ).length;

  const highRiskCount =
    criticalCount + highCount;

  const alerts = villages.filter(
    (village) =>
      village.status === "CRITICAL" ||
      village.status === "HIGH"
  );

  /* ---------------- FORMATTED TIME ---------------- */

  const formattedLastUpdated =
    lastUpdated.toLocaleTimeString();

  const formattedCurrentTime =
    currentTime.toLocaleTimeString();

  /* ---------------- SELECTED RISK ---------------- */

  const currentRisk =
    selectedVillage?.risk ?? 0;

  const peakRisk =
    riskHistory.length > 0
      ? Math.max(...riskHistory)
      : currentRisk;

  const trendText =
    getTrend(riskHistory);

  const trendClass =
    getTrendClass(riskHistory);

  return (
    <div className="app-shell">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="top-header">

        <div className="brand-section">

          <div className="brand-icon">
            🌊
          </div>

          <div>

            <h1>
              FLASHGUARD
            </h1>

            <p>
              Flash Flood Early Warning &
              Disaster Monitoring System
            </p>

          </div>

        </div>

        <div
          className={`header-status ${
            backendConnected
              ? "connection-online"
              : "connection-offline"
          }`}
        >

          <span className="status-dot"></span>

          {backendConnected
            ? "LIVE — API CONNECTED"
            : "API DISCONNECTED"}

        </div>

      </header>

      <main className="dashboard-container">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="hero-section">

          <div>

            <span className="section-label">
              LIVE MONITORING
            </span>

            <h2>
              Regional Risk Monitoring
            </h2>

            <p>
              Real-time environmental monitoring
              across monitored villages.
            </p>

          </div>

          <div className="live-clock">

            <span>
              LOCAL SYSTEM TIME
            </span>

            <strong>
              {formattedCurrentTime}
            </strong>

          </div>

        </section>

        {/* =====================================================
            MAP
        ===================================================== */}

        <section className="map-section">

          <div className="section-header">

            <div>

              <h2>
                Regional Risk Map
              </h2>

              <p>
                Live flood-risk conditions by
                monitored location
              </p>

            </div>

            <div className="map-controls">

              <label htmlFor="risk-filter">
                Filter
              </label>

              <select
                id="risk-filter"
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as RiskFilter
                  )
                }
              >

                <option value="All Regions">
                  All Regions
                </option>

                <option value="High Risk">
                  High Risk
                </option>

                <option value="Moderate Risk">
                  Moderate Risk
                </option>

                <option value="Low Risk">
                  Low Risk
                </option>

              </select>

            </div>

          </div>

          <div className="map-wrapper">

            <MapView
              filter={filter}
              onVillageSelect={
                handleVillageSelect
              }
              onVillagesUpdate={
                handleVillagesUpdate
              }
              onConnectionChange={
                handleConnectionChange
              }
            />

          </div>

          <div className="map-legend">

            <span>
              <i className="legend-dot low"></i>
              Low
            </span>

            <span>
              <i className="legend-dot moderate"></i>
              Moderate
            </span>

            <span>
              <i className="legend-dot high"></i>
              High
            </span>

            <span>
              <i className="legend-dot critical"></i>
              Critical
            </span>

          </div>

        </section>

        {/* =====================================================
            EARLY WARNING SYSTEM
        ===================================================== */}

        <section className="early-warning-section">

          <div className="early-warning-header">

            <div>

              <span className="section-label">
                EARLY WARNING SYSTEM
              </span>

              <h2>
                Regional Emergency Status
              </h2>

              <p>
                Automated flood-risk assessment based
                on live environmental conditions.
              </p>

            </div>

            <div
              className={`warning-status ${
                criticalCount > 0
                  ? "warning-critical"
                  : highCount > 0
                  ? "warning-high"
                  : moderateCount > 0
                  ? "warning-moderate"
                  : "warning-safe"
              }`}
            >

              <span className="warning-status-dot"></span>

              {criticalCount > 0
                ? "CRITICAL ALERT"
                : highCount > 0
                ? "HIGH RISK"
                : moderateCount > 0
                ? "MONITORING"
                : "NORMAL"}

            </div>

          </div>

          {/* DEMO CONTROL */}

          <div className="demo-control">

            <div>

              <strong>
                🎯 Hackathon Demo Mode
              </strong>

              <span>
                Simulate increasing flood conditions
                for Village C.
              </span>

            </div>

            <button
              className="demo-button"
              onClick={runFloodDemo}
              disabled={demoLoading}
            >

              {demoLoading
                ? "Simulating..."
                : "🚨 Run Flood Scenario"}

            </button>

          </div>

          {demoMessage && (
            <div className="demo-message">
              {demoMessage}
            </div>
          )}

          {/* WARNING CARDS */}

          <div className="early-warning-grid">

            <div className="warning-main-card">

              <div className="warning-icon">

                {criticalCount > 0
                  ? "🚨"
                  : highCount > 0
                  ? "⚠️"
                  : "🛡️"}

              </div>

              <div className="warning-main-content">

                <span>
                  CURRENT SYSTEM STATUS
                </span>

                <h3>

                  {criticalCount > 0
                    ? "Immediate attention required"
                    : highCount > 0
                    ? "High-risk conditions detected"
                    : moderateCount > 0
                    ? "Environmental conditions require monitoring"
                    : "No immediate flood warning"}

                </h3>

                <p>

                  {criticalCount > 0
                    ? `${criticalCount} monitored region${
                        criticalCount > 1
                          ? "s"
                          : ""
                      } currently classified as critical.`
                    : highCount > 0
                    ? `${highCount} high-risk region${
                        highCount > 1
                          ? "s"
                          : ""
                      } require close monitoring.`
                    : moderateCount > 0
                    ? `${moderateCount} region${
                        moderateCount > 1
                          ? "s"
                          : ""
                      } currently show moderate risk conditions.`
                    : "All monitored regions are currently within normal limits."}

                </p>

              </div>

            </div>

            <div className="warning-stat-card">

              <span>
                MONITORED REGIONS
              </span>

              <strong>
                {villages.length}
              </strong>

              <small>
                Live locations
              </small>

            </div>

            <div className="warning-stat-card">

              <span>
                HIGH-RISK REGIONS
              </span>

              <strong>
                {highRiskCount}
              </strong>

              <small>
                High + Critical
              </small>

            </div>

            <div className="warning-stat-card">

              <span>
                DATA UPDATE
              </span>

              <strong>
                5 sec
              </strong>

              <small>
                Sensor refresh interval
              </small>

            </div>

          </div>

        </section>

        {/* =====================================================
            RISK OVERVIEW
        ===================================================== */}

        <section className="overview-section">

          <div className="section-heading">

            <div>

              <h2>
                Risk Overview
              </h2>

              <p>
                Current classification of
                monitored regions
              </p>

            </div>

            <span className="monitor-count">
              {villages.length} Regions Monitored
            </span>

          </div>

          <div className="risk-cards">

            <div className="risk-card critical-card">

              <div className="risk-card-icon">
                ⚠️
              </div>

              <div>

                <span>
                  Critical
                </span>

                <strong>
                  {criticalCount}
                </strong>

                <small>
                  Immediate attention
                </small>

              </div>

            </div>

            <div className="risk-card high-card">

              <div className="risk-card-icon">
                🔶
              </div>

              <div>

                <span>
                  High Risk
                </span>

                <strong>
                  {highCount}
                </strong>

                <small>
                  Close monitoring
                </small>

              </div>

            </div>

            <div className="risk-card moderate-card">

              <div className="risk-card-icon">
                🟡
              </div>

              <div>

                <span>
                  Moderate
                </span>

                <strong>
                  {moderateCount}
                </strong>

                <small>
                  Monitor conditions
                </small>

              </div>

            </div>

            <div className="risk-card low-card">

              <div className="risk-card-icon">
                🟢
              </div>

              <div>

                <span>
                  Low Risk
                </span>

                <strong>
                  {lowCount}
                </strong>

                <small>
                  Normal conditions
                </small>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            SELECTED VILLAGE
        ===================================================== */}

        <section className="selected-village-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                SELECTED LOCATION
              </span>

              <h2>
                Village Monitoring Details
              </h2>

              <p>
                Select a location on the map to
                inspect live environmental data.
              </p>

            </div>

          </div>

          {!selectedVillage ? (

            <div className="empty-village-panel">

              <div className="empty-icon">
                📍
              </div>

              <h3>
                No village selected
              </h3>

              <p>
                Click any village marker on the
                map to view its detailed
                monitoring information.
              </p>

            </div>

          ) : (

            <div className="village-dashboard">

              <div className="village-main-panel">

                <div className="village-title-row">

                  <div>

                    <span
                      className={`status-badge ${getStatusClass(
                        selectedVillage.status
                      )}`}
                    >
                      {selectedVillage.status}
                    </span>

                    <h3>
                      {selectedVillage.name}
                    </h3>

                    <p>
                      Live environmental
                      monitoring
                    </p>

                  </div>

                  <button
                    className="details-button"
                    onClick={() =>
                      setShowDetails(true)
                    }
                  >
                    View Full Details →
                  </button>

                </div>

                <div className="risk-score-area">

                  <div
                    className={`risk-circle ${getStatusClass(
                      selectedVillage.status
                    )}`}
                  >

                    <strong>
                      {selectedVillage.risk}
                    </strong>

                    <span>
                      /100
                    </span>

                  </div>

                  <div className="risk-summary">

                    <span>
                      CURRENT RISK SCORE
                    </span>

                    <h3>

                      {selectedVillage.status ===
                      "CRITICAL"
                        ? "Critical Flood Risk"
                        : selectedVillage.status ===
                          "HIGH"
                        ? "High Flood Risk"
                        : selectedVillage.status ===
                          "MODERATE"
                        ? "Moderate Flood Risk"
                        : "Low Flood Risk"}

                    </h3>

                    <p>
                      {getRiskMessage(
                        selectedVillage.status
                      )}
                    </p>

                    <div className="risk-meter">

                      <div
                        className={`risk-meter-fill ${getStatusClass(
                          selectedVillage.status
                        )}`}
                        style={{
                          width: `${selectedVillage.risk}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                </div>

                {/* RISK TREND */}

                <div className="risk-history-section">

                  <div className="subsection-title">

                    <div>

                      <h3>
                        Live Risk Trend
                      </h3>

                      <span className="risk-history-current">
                        Current: {currentRisk}/100
                      </span>

                    </div>

                    <span
                      className={`trend-badge ${trendClass}`}
                    >
                      {trendText}
                    </span>

                  </div>

                  <div className="risk-history-stats">

                    <div>

                      <span>
                        CURRENT
                      </span>

                      <strong>
                        {currentRisk}/100
                      </strong>

                    </div>

                    <div>

                      <span>
                        PEAK
                      </span>

                      <strong>
                        {peakRisk}/100
                      </strong>

                    </div>

                    <div>

                      <span>
                        READINGS
                      </span>

                      <strong>
                        {riskHistory.length}
                      </strong>

                    </div>

                  </div>

                  <div className="risk-history-card">

                    {riskHistory.length === 0 ? (

                      <p className="risk-history-empty">
                        Collecting live risk data...
                      </p>

                    ) : (

                      <div className="risk-history-chart">

                        {riskHistory.map(
                          (risk, index) => {

                            const barClass =
                              risk > 80
                                ? "risk-critical"
                                : risk > 60
                                ? "risk-high"
                                : risk > 30
                                ? "risk-moderate"
                                : "risk-low";

                            return (

                              <div
                                key={`${risk}-${index}`}
                                className="risk-history-point"
                              >

                                <div
                                  className={`risk-history-bar ${barClass}`}
                                  style={{
                                    height: `${Math.max(
                                      risk,
                                      8
                                    )}%`,
                                  }}
                                >

                                  <span>
                                    {risk}
                                  </span>

                                </div>

                              </div>

                            );
                          }
                        )}

                      </div>

                    )}

                    <div className="risk-history-labels">

                      <span>
                        Earlier
                      </span>

                      <span>
                        Latest
                      </span>

                    </div>

                  </div>

                </div>

                {/* SENSORS */}

                <div className="sensor-section">

                  <div className="subsection-title">

                    <h3>
                      Live Environmental Sensors
                    </h3>

                    <span className="live-tag">
                      ● LIVE
                    </span>

                  </div>

                  <div className="sensor-grid">

                    <div className="sensor-card">

                      <span className="sensor-icon">
                        🌧️
                      </span>

                      <div>

                        <small>
                          Rainfall
                        </small>

                        <strong>
                          {selectedVillage.rainfall}
                          <em> mm</em>
                        </strong>

                      </div>

                    </div>

                    <div className="sensor-card">

                      <span className="sensor-icon">
                        🌱
                      </span>

                      <div>

                        <small>
                          Soil Moisture
                        </small>

                        <strong>
                          {selectedVillage.soilMoisture}
                          <em>%</em>
                        </strong>

                      </div>

                    </div>

                    <div className="sensor-card">

                      <span className="sensor-icon">
                        💧
                      </span>

                      <div>

                        <small>
                          Water Level
                        </small>

                        <strong>
                          {selectedVillage.waterLevel}
                          <em> cm</em>
                        </strong>

                      </div>

                    </div>

                    <div className="sensor-card">

                      <span className="sensor-icon">
                        ⛰️
                      </span>

                      <div>

                        <small>
                          Slope
                        </small>

                        <strong>
                          {selectedVillage.slope}
                          <em>°</em>
                        </strong>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* RISK ANALYSIS */}

              <div className="risk-analysis-panel">

                <div className="subsection-title">

                  <h3>
                    Risk Factor Analysis
                  </h3>

                </div>

                <div className="factor-list">

                  <div className="factor-item">

                    <div className="factor-header">

                      <span>
                        🌧️ Rainfall
                      </span>

                      <strong>
                        {getRiskFactor(
                          selectedVillage.rainfall,
                          120
                        )}
                        %
                      </strong>

                    </div>

                    <div className="factor-bar">

                      <div
                        style={{
                          width: `${getRiskFactor(
                            selectedVillage.rainfall,
                            120
                          )}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                  <div className="factor-item">

                    <div className="factor-header">

                      <span>
                        🌱 Soil Moisture
                      </span>

                      <strong>
                        {selectedVillage.soilMoisture}%
                      </strong>

                    </div>

                    <div className="factor-bar">

                      <div
                        style={{
                          width: `${selectedVillage.soilMoisture}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                  <div className="factor-item">

                    <div className="factor-header">

                      <span>
                        💧 Water Level
                      </span>

                      <strong>
                        {getRiskFactor(
                          selectedVillage.waterLevel,
                          80
                        )}
                        %
                      </strong>

                    </div>

                    <div className="factor-bar">

                      <div
                        style={{
                          width: `${getRiskFactor(
                            selectedVillage.waterLevel,
                            80
                          )}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                  <div className="factor-item">

                    <div className="factor-header">

                      <span>
                        ⛰️ Terrain Slope
                      </span>

                      <strong>
                        {getRiskFactor(
                          selectedVillage.slope,
                          40
                        )}
                        %
                      </strong>

                    </div>

                    <div className="factor-bar">

                      <div
                        style={{
                          width: `${getRiskFactor(
                            selectedVillage.slope,
                            40
                          )}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                </div>

                <div className="response-box">

                  <span>
                    RECOMMENDED RESPONSE
                  </span>

                  <strong>

                    {selectedVillage.status ===
                    "CRITICAL"
                      ? "Activate emergency response and prepare evacuation."
                      : selectedVillage.status ===
                        "HIGH"
                      ? "Increase monitoring and prepare local response teams."
                      : selectedVillage.status ===
                        "MODERATE"
                      ? "Continue monitoring environmental conditions."
                      : "Continue routine monitoring."}

                  </strong>

                </div>

                <div className="location-box">

                  <span>
                    📍 MONITORED LOCATION
                  </span>

                  <strong>
                    {selectedVillage.lat.toFixed(4)}
                    ,{" "}
                    {selectedVillage.lng.toFixed(4)}
                  </strong>

                </div>

              </div>

            </div>

          )}

        </section>

        {/* =====================================================
            AUTOMATIC ALERTS
        ===================================================== */}

        <section className="automatic-alert-section">

          <div className="automatic-alert-header">

            <div>

              <h2>
                Automatic Risk Alerts
              </h2>

              <p>
                Alerts generated automatically
                from current sensor conditions.
              </p>

            </div>

            <div className="alert-count">
              {alerts.length} Active Alerts
            </div>

          </div>

          {alerts.length === 0 ? (

            <div className="no-alerts">

              <span>
                ✓
              </span>

              <strong>
                No active high-risk alerts
              </strong>

              <p>
                All monitored regions are
                currently below the high-risk
                threshold.
              </p>

            </div>

          ) : (

            <div className="alert-list">

              {alerts.map((village) => (

                <div
                  key={village.id}
                  className={`automatic-alert-card ${
                    village.status ===
                    "CRITICAL"
                      ? "critical"
                      : "high"
                  }`}
                >

                  <div className="alert-card-icon">

                    {village.status ===
                    "CRITICAL"
                      ? "🚨"
                      : "⚠️"}

                  </div>

                  <div className="alert-card-content">

                    <strong>
                      {village.name}
                    </strong>

                    <span>
                      {village.status} RISK • SCORE{" "}
                      {village.risk}/100
                    </span>

                    <p>
                      Rainfall{" "}
                      {village.rainfall} mm •
                      Water level{" "}
                      {village.waterLevel} cm
                    </p>

                  </div>

                  <button
                    className="alert-view-button"
                    onClick={() => {

                      setSelectedVillageId(
                        village.id
                      );

                      setRiskHistory([
                        village.risk,
                      ]);

                      setShowDetails(true);

                    }}
                  >
                    View
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =====================================================
            SYSTEM ACTIVITY
        ===================================================== */}

        <section className="system-activity-section">

          <div className="section-heading">

            <div>

              <h2>
                System Activity
              </h2>

              <p>
                Current FLASHGUARD monitoring
                pipeline status
              </p>

            </div>

          </div>

          <div className="activity-grid">

            <div className="activity-card">

              <div className="activity-icon">
                🔌
              </div>

              <div className="activity-content">

                <span>
                  API Connection
                </span>

                <strong
                  className={
                    backendConnected
                      ? "activity-online"
                      : "activity-offline"
                  }
                >
                  {backendConnected
                    ? "Connected"
                    : "Disconnected"}
                </strong>

              </div>

            </div>

            <div className="activity-card">

              <div className="activity-icon">
                📡
              </div>

              <div className="activity-content">

                <span>
                  Data Stream
                </span>

                <strong
                  className={
                    backendConnected
                      ? "activity-online"
                      : "activity-offline"
                  }
                >
                  {backendConnected
                    ? "Receiving Live Data"
                    : "No Data"}
                </strong>

              </div>

            </div>

            <div className="activity-card">

              <div className="activity-icon">
                🔄
              </div>

              <div className="activity-content">

                <span>
                  Update Frequency
                </span>

                <strong>
                  Every 5 seconds
                </strong>

              </div>

            </div>

            <div className="activity-card">

              <div className="activity-icon">
                🕐
              </div>

              <div className="activity-content">

                <span>
                  Last Data Received
                </span>

                <strong>
                  {formattedLastUpdated}
                </strong>

              </div>

            </div>

            <div className="activity-card">

              <div className="activity-icon">
                📍
              </div>

              <div className="activity-content">

                <span>
                  Monitored Regions
                </span>

                <strong>
                  {villages.length}
                </strong>

              </div>

            </div>

            <div className="activity-card">

              <div className="activity-icon">
                🚨
              </div>

              <div className="activity-content">

                <span>
                  Active Alerts
                </span>

                <strong
                  className={
                    highRiskCount > 0
                      ? "activity-offline"
                      : "activity-online"
                  }
                >
                  {highRiskCount}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="dashboard-footer">

          <div>

            <strong>
              FLASHGUARD
            </strong>

            <span>
              Flash Flood Early Warning &
              Disaster Monitoring System
            </span>

          </div>

          <span>
            Prototype • Live Monitoring
            Pipeline
          </span>

        </footer>

      </main>

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {showDetails && selectedVillage && (

        <div
          className="details-modal-overlay"
          onClick={() =>
            setShowDetails(false)
          }
        >

          <div
            className="details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span
                  className={`status-badge ${getStatusClass(
                    selectedVillage.status
                  )}`}
                >
                  {selectedVillage.status}
                </span>

                <h2>
                  {selectedVillage.name}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowDetails(false)
                }
              >
                ×
              </button>

            </div>

            <div className="modal-risk">

              <div className="modal-risk-score">

                {selectedVillage.risk}

                <span>
                  /100
                </span>

              </div>

              <div>

                <strong>
                  Current Risk Score
                </strong>

                <p>
                  {getRiskMessage(
                    selectedVillage.status
                  )}
                </p>

              </div>

            </div>

            <div className="modal-sensor-grid">

              <div>

                <span>
                  🌧️ Rainfall
                </span>

                <strong>
                  {selectedVillage.rainfall} mm
                </strong>

              </div>

              <div>

                <span>
                  🌱 Soil Moisture
                </span>

                <strong>
                  {selectedVillage.soilMoisture}%
                </strong>

              </div>

              <div>

                <span>
                  💧 Water Level
                </span>

                <strong>
                  {selectedVillage.waterLevel} cm
                </strong>

              </div>

              <div>

                <span>
                  ⛰️ Slope
                </span>

                <strong>
                  {selectedVillage.slope}°
                </strong>

              </div>

            </div>

            <div className="modal-location">

              <span>
                LOCATION
              </span>

              <strong>
                Latitude:{" "}
                {selectedVillage.lat.toFixed(5)}
              </strong>

              <strong>
                Longitude:{" "}
                {selectedVillage.lng.toFixed(5)}
              </strong>

            </div>

            <div className="modal-response">

              <span>
                RECOMMENDED RESPONSE
              </span>

              <strong>

                {selectedVillage.status ===
                "CRITICAL"
                  ? "Activate emergency response and prepare evacuation."
                  : selectedVillage.status ===
                    "HIGH"
                  ? "Increase monitoring and prepare local response teams."
                  : selectedVillage.status ===
                    "MODERATE"
                  ? "Continue monitoring environmental conditions."
                  : "Continue routine monitoring."}

              </strong>

            </div>

            <div className="modal-footer">

              Live data • Updated{" "}
              {formattedLastUpdated}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;