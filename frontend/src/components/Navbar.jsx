import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const product = searchParams.get('product');
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar" style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.75rem 2rem', 
      borderBottom: '1px solid var(--glass-border)', 
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div className="logo">
        <Link to="/" style={{ color: 'var(--accent-positive)', textDecoration: 'none', fontWeight: 800, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
          Cortex AI
        </Link>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {product && (
          <div className="nav-links" style={{ display: 'flex', gap: '0.25rem' }}>
            <Link 
              to={`/feed?product=${encodeURIComponent(product)}`}
              style={{ 
                color: location.pathname === '/feed' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                textDecoration: 'none', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', 
                background: location.pathname === '/feed' ? 'var(--accent-positive-bg)' : 'transparent',
                fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease'
              }}
            >
              Live Feed
            </Link>
            {user?.role === 'analyst' && (
              <Link 
                to={`/analysis?product=${encodeURIComponent(product)}`}
                style={{ 
                  color: location.pathname === '/analysis' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                  textDecoration: 'none', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', 
                  background: location.pathname === '/analysis' ? 'var(--accent-positive-bg)' : 'transparent',
                  fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease'
                }}
              >
                Analysis
              </Link>
            )}
          </div>
        )}
        
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px',
            borderRadius: '0.5rem',
            border: '1px solid var(--glass-border)',
            background: 'var(--surface-container)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {theme === 'dark' 
            ? <Sun size={16} strokeWidth={2.2} style={{ transition: 'transform 0.4s ease', transform: 'rotate(0deg)' }} /> 
            : <Moon size={16} strokeWidth={2.2} style={{ transition: 'transform 0.4s ease', transform: 'rotate(-30deg)' }} />
          }
        </button>
        {(user?.role === 'analyst' || user?.role === 'marketing') ? (
          <button
            onClick={logout}
            title="Logout"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--accent-negative-bg)',
              color: 'var(--accent-negative)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        ) : (
          <Link
            to="/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.4rem 0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              background: 'var(--surface-container)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '0.8rem', fontWeight: 600,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-positive)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
          >
            Login as Org
          </Link>
        )}
      </div>
    </nav>
  );
}
