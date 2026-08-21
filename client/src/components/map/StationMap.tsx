/**
 * StationMap — Interactive map showing station locations with risk-colored markers.
 *
 * TODO: Implement with react-leaflet
 * - Color markers by risk category
 * - Click marker to navigate to station detail
 * - Cluster markers at zoom levels
 */
export default function StationMap() {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        color: 'var(--color-text-muted)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 'var(--font-size-lg)' }}>🗺️ Station Map</p>
        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
          Interactive Leaflet map — implement with react-leaflet
        </p>
      </div>
    </div>
  );
}
