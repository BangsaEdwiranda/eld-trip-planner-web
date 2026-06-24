import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import type { Trip } from '../../api/types'
import { toLatLng, toLatLngPath } from '../../lib/geo'
import { MARKER_COLORS, ROUTE_COLOR } from '../../lib/mapStyle'
import { isoToTripTime } from '../../lib/format'
import { placeStops } from '../../lib/stopPlacement'
import { dotIcon, pinIcon } from './markers'

interface Props {
  trip: Trip
  activeStopKey?: number | null
  onHoverStop?: (key: number | null) => void
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, bounds])
  return null
}

export function RouteMap({ trip, activeStopKey, onHoverStop }: Props) {
  const path = useMemo(() => toLatLngPath(trip.route_geometry), [trip.route_geometry])
  const placed = useMemo(() => placeStops(trip), [trip])

  const bounds = useMemo<LatLngBoundsExpression>(() => {
    const pts = path.length > 0 ? path : [toLatLng(trip.current_coords), toLatLng(trip.dropoff_coords)]
    return pts as LatLngBoundsExpression
  }, [path, trip])

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds bounds={bounds} />

      {path.length > 1 && (
        <>
          {/* casing + line for a crisp route (single color, not status-split) */}
          <Polyline positions={path} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
          <Polyline positions={path} pathOptions={{ color: ROUTE_COLOR, weight: 4, opacity: 0.95 }} />
        </>
      )}

      {/* Rest / fuel / break stops (positions supplied by the backend) */}
      {placed.map((p) => (
        <Marker
          key={`stop-${p.index}`}
          position={toLatLng(p.coord)}
          icon={dotIcon(MARKER_COLORS.stop)}
          eventHandlers={{
            mouseover: () => onHoverStop?.(p.index),
            mouseout: () => onHoverStop?.(null),
          }}
          zIndexOffset={activeStopKey === p.index ? 1000 : 0}
        >
          <Tooltip direction="top">
            <strong>{p.stop.type}</strong>
            <br />
            {isoToTripTime(p.stop.start)} – {isoToTripTime(p.stop.end)}
            {p.stop.location ? (
              <>
                <br />
                {p.stop.location}
              </>
            ) : null}
          </Tooltip>
        </Marker>
      ))}

      {/* Primary waypoints */}
      <Marker position={toLatLng(trip.current_coords)} icon={pinIcon(MARKER_COLORS.start, 'Start')}>
        <Popup>
          <strong>Start</strong>
          <br />
          {trip.current_location}
        </Popup>
      </Marker>
      <Marker position={toLatLng(trip.pickup_coords)} icon={pinIcon(MARKER_COLORS.pickup, 'Pickup')}>
        <Popup>
          <strong>Pickup</strong>
          <br />
          {trip.pickup_location}
        </Popup>
      </Marker>
      <Marker position={toLatLng(trip.dropoff_coords)} icon={pinIcon(MARKER_COLORS.dropoff, 'Dropoff')}>
        <Popup>
          <strong>Dropoff</strong>
          <br />
          {trip.dropoff_location}
        </Popup>
      </Marker>
    </MapContainer>
  )
}
