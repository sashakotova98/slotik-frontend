import { useEffect } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number | null;
  longitude: number | null;
  disabled?: boolean; // не можна змінбвати точку в продовж збереження.
  onChange: (latitude: number | null, longitude: number | null) => void;
};

// Власна позначка без окремих файлів зображень.
const locationIcon = divIcon({
  className: "",
  html: `
    <div style="
      width: 26px;
      height: 26px;
      background: #171717;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px #0004;
    "></div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

// Цей компонент має бути всередині MapContainer.
function LocationMarker({ latitude, longitude, disabled, onChange }: Props) {
  const map = useMap();

  useMapEvents({
    click(event) {
      if (disabled) {
        return;
      }

      const point = event.latlng.wrap();//карта отримує координати в межах допустимого діапазону. округлення до 6 знаків після коми відбувається нижче.

      onChange(Number(point.lat.toFixed(6)), Number(point.lng.toFixed(6)));
    },
  });

  // Коли завантажили збережені координати — показуємо їх на карті.
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.panTo([latitude, longitude]); // переміщуємо карту до збережених координат.
    }
  }, [latitude, longitude, map]);

  if (latitude === null || longitude === null) {
    return null;
  }

  return <Marker position={[latitude, longitude]} icon={locationIcon} />;
}

export default function MasterLocationPicker({ latitude, longitude, disabled = false, onChange }: Props) {
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg text-copy-600">
          Місце на карті
          <span className="ml-2 text-sm text-copy-400">необов’язково</span>
        </h3>

        <p className="mt-1 text-sm text-copy-500">
          Натисніть на карту, щоб позначити місце прийому. Повторне натискання перемістить позначку.
        </p>
      </div>

      <div className="relative isolate overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={[latitude ?? 50.4501, longitude ?? 30.5234]}
          zoom={hasLocation ? 16 : 11}
          scrollWheelZoom={false}
          className="h-72 w-full sm:h-80"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker latitude={latitude} longitude={longitude} disabled={disabled} onChange={onChange} />
        </MapContainer>
      </div>

      {hasLocation ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-copy-500">Місце обрано. Збережіть зміни у формі.</p>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(null, null);
            }}
            className="min-h-11 rounded-xl bg-panel-50 px-3 text-sm text-copy-600 hover:bg-panel-100 disabled:opacity-50"
          >
            Прибрати позначку
          </button>
        </div>
      ) : (
        <p className="text-sm text-copy-500">Позначку не обрано. Можна продовжити без неї.</p>
      )}
    </section>
  );
}

