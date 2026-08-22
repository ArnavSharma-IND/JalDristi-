import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Droplets,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Radio,
  FileCode,
  Layers,
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview & Telemetry', icon: LayoutDashboard },
    { path: '/districts', label: 'Districts Matrix', icon: MapPin },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-deep)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '280px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 13, 26, 0.98) 100%)',
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        {/* Government / JalDrishti Brand Header */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: '#ffffff',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)',
            }}
          >
            <Droplets size={24} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              JalDrishti
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              जलदृष्टि • Water Intelligence
            </div>
          </div>
        </Link>

        {/* Live Network Status Indicator */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="radar-live"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
              DWLR Network Live
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            6,424 nodes
          </span>
        </div>

        {/* Navigation Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              color: 'var(--color-text-dim)',
              letterSpacing: '0.08em',
              fontWeight: 700,
              paddingLeft: '8px',
              marginBottom: '4px',
            }}
          >
            Navigation
          </span>

          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.05) 100%)'
                    : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-water-primary)' : '3px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 'var(--font-size-sm)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-water-light)' : 'var(--color-text-muted)'} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Resources & Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              color: 'var(--color-text-dim)',
              letterSpacing: '0.08em',
              fontWeight: 700,
              paddingLeft: '8px',
              marginBottom: '4px',
            }}
          >
            Technical Assets
          </span>

          <a
            href="http://127.0.0.1:8000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCode size={16} color="var(--color-text-muted)" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink size={12} color="var(--color-text-muted)" />
          </a>

          <a
            href="https://indiawris.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={16} color="var(--color-text-muted)" />
              <span>India-WRIS Portal</span>
            </div>
            <ExternalLink size={12} color="var(--color-text-muted)" />
          </a>
        </div>

        {/* Footer info badge */}
        <div
          style={{
            marginTop: 'auto',
            padding: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
            SIH 2025 • Problem Statement 068
          </div>
          <div>Ministry of Jal Shakti</div>
          <div style={{ color: 'var(--color-water-light)', marginTop: '4px', fontSize: '0.65rem' }}>
            CGWB Statutory Engine v2.0
          </div>
        </div>
      </aside>

      {/* Main Page Content */}
      <main
        style={{
          flex: 1,
          padding: 'var(--space-8)',
          overflowY: 'auto',
          maxWidth: '1500px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
