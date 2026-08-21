import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, LayoutDashboard, MapPin } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/districts', label: 'Districts', icon: MapPin },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav
        style={{
          width: '260px',
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
          }}
        >
          <Droplets size={28} color="var(--color-water-primary)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>
              JalDrishti
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              जलदृष्टि • WATER VISION
            </div>
          </div>
        </Link>

        {/* Nav Items */}
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                color: isActive
                  ? 'var(--color-water-light)'
                  : 'var(--color-text-secondary)',
                background: isActive
                  ? 'rgba(14, 165, 233, 0.1)'
                  : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 'var(--font-size-sm)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          <div>SIH 2025 • PS 068</div>
          <div>Ministry of Jal Shakti</div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: 'var(--space-8)',
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
