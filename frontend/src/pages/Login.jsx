import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { BarChart3, Megaphone, Lock, Mail, ChevronRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('analyst');
  const [isLogin, setIsLogin] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || (!isLogin && !companyName)) return;

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { company_name: companyName, email, password };

      const res = await fetch(`http://localhost:8001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Authentication failed');
        return;
      }

      login({
        role: activeRole,
        enterpriseId: data.enterprise_id,
        companyName: data.company_name,
        email: data.email
      });
      navigate('/');
    } catch (err) {
      setError('Network error. Is the server running?');
    }
  };

  return (
    <div style={{ height: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '1.5rem',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '3rem 2.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--accent-positive-bg)', color: 'var(--accent-positive)',
            marginBottom: '1rem'
          }}>
            <Lock size={24} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Portal Access
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome back to the Cortex AI command center.
          </p>
        </div>

        {/* Tabs */}
        {isLogin && (
          <div style={{ 
            display: 'flex', background: 'var(--surface-container)', padding: '0.35rem', 
            borderRadius: '0.85rem', marginBottom: '2.5rem', border: '1px solid var(--glass-border)' 
          }}>
            <button
              onClick={() => setActiveRole('analyst')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '0.7rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s ease',
                background: activeRole === 'analyst' ? 'var(--surface)' : 'transparent',
                color: activeRole === 'analyst' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeRole === 'analyst' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <BarChart3 size={16} /> Analyst
            </button>
            <button
              onClick={() => setActiveRole('marketing')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '0.7rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s ease',
                background: activeRole === 'marketing' ? 'var(--surface)' : 'transparent',
                color: activeRole === 'marketing' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeRole === 'marketing' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Megaphone size={16} /> Marketing
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--accent-negative-bg)', color: 'var(--accent-negative)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Enterprise Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required={!isLogin}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Samsung, Apple"
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem',
                    border: '1px solid var(--glass-border)', background: 'var(--surface-container)',
                    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--accent-positive)'; e.target.style.background = 'var(--surface)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'var(--surface-container)'; }}
                />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '0.75rem',
                  border: '1px solid var(--glass-border)', background: 'var(--surface-container)',
                  color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-positive)'; e.target.style.background = 'var(--surface)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'var(--surface-container)'; }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '0.75rem',
                  border: '1px solid var(--glass-border)', background: 'var(--surface-container)',
                  color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-positive)'; e.target.style.background = 'var(--surface)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'var(--surface-container)'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', border: 'none',
              background: 'var(--accent-positive)', color: '#fff', fontSize: '1rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 10px 20px -5px rgba(52, 211, 153, 0.4)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
          >
            {isLogin ? 'Enter Dashboard' : 'Create Account'} <ChevronRight size={18} />
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>

      {/* Background Decorative Element */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px', background: 'var(--accent-positive)',
        filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none'
      }} />
    </div>
  );
}

