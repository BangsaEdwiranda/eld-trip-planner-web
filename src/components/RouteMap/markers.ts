import L from 'leaflet'

/**
 * A teardrop pin carrying its ROLE label ("Start"/"Pickup"/"Dropoff") in a chip
 * above it — not a bare letter. The chip color matches the map legend, so pin
 * and legend read as the same thing. (CLAUDE.md: label markers by role.)
 */
export function pinIcon(color: string, label: string): L.DivIcon {
  const pin = 32
  const w = 110
  const chipH = 18
  const h = chipH + pin
  return L.divIcon({
    className: 'eld-pin',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:${w}px;height:${h}px;">
        <span style="white-space:nowrap;background:#fff;color:${color};font:700 11px Inter,sans-serif;
          padding:1px 8px;border-radius:9999px;border:1.5px solid ${color};
          box-shadow:0 1px 3px rgba(0,0,0,.25);line-height:16px;">${label}</span>
        <svg width="${pin}" height="${pin}" viewBox="0 0 30 30" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));margin-top:-1px;">
          <path d="M15 1 C7.8 1 2 6.8 2 14 c0 8.5 11 14.5 12.4 15.6 a1 1 0 0 0 1.2 0 C17 28.5 28 22.5 28 14 28 6.8 22.2 1 15 1 Z"
            fill="${color}" stroke="#fff" stroke-width="2"/>
          <circle cx="15" cy="13.5" r="4.5" fill="#fff"/>
        </svg>
      </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h], // pin tip at bottom-center
    popupAnchor: [0, -h + 2],
  })
}

/** Small dot marker for interpolated rest/fuel/break stops. */
export function dotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'eld-dot',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};
      border:2.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  })
}
