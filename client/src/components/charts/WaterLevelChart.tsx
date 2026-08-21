/**
 * WaterLevelChart — Time-series chart of water-level readings.
 *
 * TODO: Implement with Recharts
 * - Historical readings as area chart
 * - Forecast projection as dashed line
 * - Risk threshold horizontal lines
 * - Hover tooltip with exact values
 */
export default function WaterLevelChart() {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        color: 'var(--color-text-muted)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 'var(--font-size-lg)' }}>📈 Water Level Trend</p>
        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
          Recharts time-series with forecast overlay
        </p>
      </div>
    </div>
  );
}
