import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

export type RiskFilter =
  | "All Regions"
  | "High Risk"
  | "Moderate Risk"
  | "Low Risk";

export type Village = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  rainfall: number;
  soilMoisture: number;
  waterLevel: number;
  slope: number;
  risk: number;
  status:
    | "LOW"
    | "MODERATE"
    | "HIGH"
    | "CRITICAL";
};

type MapViewProps = {
  filter: RiskFilter;

  onVillageSelect: (
    village: Village
  ) => void;

  onVillagesUpdate?: (
    villages: Village[]
  ) => void;

  onConnectionChange?: (
    connected: boolean
  ) => void;
};

function getColor(risk: number) {
  if (risk <= 30) {
    return "#39d98a";
  }

  if (risk <= 60) {
    return "#ffd43b";
  }

  if (risk <= 80) {
    return "#ff922b";
  }

  return "#ff4d4d";
}

export default function MapView({
  filter,
  onVillageSelect,
  onVillagesUpdate,
  onConnectionChange,
}: MapViewProps) {

  const [villages, setVillages] =
    useState<Village[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);


  // =====================================
  // FETCH LIVE DATA
  // =====================================

  const fetchVillages = () => {

    fetch(
      "http://localhost:5000/api/villages"
    )
      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Failed to fetch villages"
          );
        }

        return response.json();

      })
      .then((data: Village[]) => {

        setVillages(data);

        if (onVillagesUpdate) {
          onVillagesUpdate(data);
        }

        setLoading(false);
        setError(false);

        if (onConnectionChange) {
          onConnectionChange(true);
        }

      })
      .catch((error) => {

        console.error(error);

        setError(true);
        setLoading(false);

        if (onConnectionChange) {
          onConnectionChange(false);
        }

      });

  };


  // =====================================
  // AUTOMATIC UPDATE EVERY 5 SECONDS
  // =====================================

  useEffect(() => {

    fetchVillages();

    const interval =
      setInterval(() => {

        fetchVillages();

      }, 5000);

    return () =>
      clearInterval(interval);

  }, []);


  // =====================================
  // FILTER
  // =====================================

  const filteredVillages =
    villages.filter((village) => {

      if (
        filter === "All Regions"
      ) {
        return true;
      }

      if (
        filter === "High Risk"
      ) {

        return (
          village.status === "HIGH" ||
          village.status === "CRITICAL"
        );

      }

      if (
        filter === "Moderate Risk"
      ) {

        return (
          village.status === "MODERATE"
        );

      }

      if (
        filter === "Low Risk"
      ) {

        return (
          village.status === "LOW"
        );

      }

      return true;

    });


  // =====================================
  // LOADING
  // =====================================

  if (loading) {

    return (
      <div
        style={{
          height: "470px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f7fa",
          borderRadius: "14px",
        }}
      >

        <strong>
          Loading live sensor data...
        </strong>

      </div>
    );

  }


  // =====================================
  // ERROR
  // =====================================

  if (error) {

    return (
      <div
        style={{
          height: "470px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#fff1f1",
          borderRadius: "14px",
          color: "#d63031",
          gap: "10px",
        }}
      >

        <strong>
          ⚠️ Unable to connect to Flashguard backend
        </strong>

        <span>
          Make sure the backend is running on
          localhost:5000.
        </span>

      </div>
    );

  }


  // =====================================
  // MAP
  // =====================================

  return (

    <MapContainer
      center={[30.075, 78.29]}
      zoom={13}
      style={{
        height: "470px",
        width: "100%",
        borderRadius: "14px",
      }}
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {filteredVillages.map(
        (village) => (

          <CircleMarker
            key={village.id}
            center={[
              village.lat,
              village.lng,
            ]}
            radius={12}
            pathOptions={{
              color: getColor(
                village.risk
              ),
              fillColor: getColor(
                village.risk
              ),
              fillOpacity: 0.8,
            }}
            eventHandlers={{
              click: () => {

                onVillageSelect(
                  village
                );

              },
            }}
          >

            <Popup>

              <div>

                <strong>
                  {village.name}
                </strong>

                <br />
                <br />

                <strong>
                  Risk:
                </strong>{" "}
                {village.risk}/100

                <br />

                <strong>
                  Status:
                </strong>{" "}
                {village.status}

                <br />
                <br />

                🌧️ Rainfall:{" "}
                {village.rainfall} mm

                <br />

                🌱 Soil:{" "}
                {village.soilMoisture}%

                <br />

                💧 Water:{" "}
                {village.waterLevel} cm

                <br />

                ⛰️ Slope:{" "}
                {village.slope}°

              </div>

            </Popup>

          </CircleMarker>

        )
      )}

    </MapContainer>

  );
}