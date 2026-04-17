import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const EXAMPLES = [
  "Dyson V15 Detect Vacuum",
  "Tesla Model Y",
  "PlayStation 5 Pro",
  "Nike Air Zoom Pegasus 40",
  "Breville Barista Express",
  "Herman Miller Aeron Chair",
  "Sony WH-1000XM5 Headphones",
  "Litter-Robot 4",
  "Dyson Airwrap",
  "Apple iPad Pro M4",
  "Mamaearth Sunscreen",
  "Tropicana Mixed Fruit Juice",
  "Lays Chips"
];

// Floating interactive orbs that follow mouse
function FloatingOrbs() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const orbsRef = useRef([]);

  const initOrbs = useCallback((w, h) => {
    const orbs = [];
    const colors = [
      'var(--accent-positive)',
      'var(--accent-negative)',
      'var(--accent-neutral)',
      'var(--accent-mixed)',
    ];
    for (let i = 0; i < 6; i++) {
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        targetX: Math.random() * w,
        targetY: Math.random() * h,
        radius: 80 + Math.random() * 160,
        colorIdx: i % colors.length,
        speed: 0.003 + Math.random() * 0.005,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.002 + Math.random() * 0.003,
      });
    }
    orbsRef.current = orbs;
    return colors;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const rootStyle = getComputedStyle(document.documentElement);
    const getColor = (varName) => rootStyle.getPropertyValue(varName).trim();
    
    const colors = initOrbs(canvas.width, canvas.height);

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.parentElement.addEventListener('mousemove', handleMouse);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const rs = getComputedStyle(document.documentElement);

      const resolvedColors = [
        rs.getPropertyValue('--accent-positive').trim() || '#34d399',
        rs.getPropertyValue('--accent-negative').trim() || '#f87171',
        rs.getPropertyValue('--accent-neutral').trim() || '#fbbf24',
        rs.getPropertyValue('--accent-mixed').trim() || '#60a5fa',
      ];

      orbsRef.current.forEach((orb) => {
        // Drift naturally
        orb.driftAngle += orb.driftSpeed;
        orb.targetX += Math.cos(orb.driftAngle) * 0.5;
        orb.targetY += Math.sin(orb.driftAngle) * 0.5;

        // Attract slightly towards mouse
        if (mx > 0 && my > 0) {
          orb.targetX += (mx - orb.targetX) * 0.008;
          orb.targetY += (my - orb.targetY) * 0.008;
        }

        // Keep in bounds
        orb.targetX = Math.max(0, Math.min(canvas.width, orb.targetX));
        orb.targetY = Math.max(0, Math.min(canvas.height, orb.targetY));

        // Ease to target
        orb.x += (orb.targetX - orb.x) * orb.speed;
        orb.y += (orb.targetY - orb.y) * orb.speed;

        // Draw glow
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        const c = resolvedColors[orb.colorIdx];
        gradient.addColorStop(0, c + '18');
        gradient.addColorStop(0.5, c + '08');
        gradient.addColorStop(1, c + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouse);
    };
  }, [initOrbs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// Floating sentiment keywords
const FLOATING_WORDS = [
  'Positive', 'Negative', 'Neutral', 'Mixed', 'Sentiment', 'Aspect',
  'NLP', 'AI', 'Review', 'Insight', 'Confidence', 'Analysis',
  'Emotion', 'Feature', 'Trend', 'Signal'
];

function FloatingWords() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {FLOATING_WORDS.map((word, i) => {
        const top = 10 + Math.random() * 80;
        const left = 5 + Math.random() * 90;
        const delay = Math.random() * 8;
        const dur = 15 + Math.random() * 20;
        return (
          <motion.span
            key={word + i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0.04, 0.08, 0], y: [0, -30, 0, 30, 0] }}
            transition={{ duration: dur, repeat: Infinity, delay, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: `${left}%`,
              fontFamily: 'Outfit, sans-serif',
              fontSize: `${0.65 + Math.random() * 0.7}rem`,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % EXAMPLES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/feed?product=${encodeURIComponent(query)}`);
    } else {
      // If empty search, use the current placeholder!
      navigate(`/feed?product=${encodeURIComponent(EXAMPLES[placeholderIndex])}`);
    }
  };

  return (
    <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Interactive background */}
      <FloatingOrbs />
      <FloatingWords />

      {/* Content */}
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: '2.5rem', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}
      >
        Search Products
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}
      >
        Analyze real-time customer feedback using Cortex AI.
      </motion.p>

      <motion.form 
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        style={{ width: '100%', maxWidth: '500px', display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 1 }}
      >
        <input 
          type="text" 
          placeholder={`e.g. ${EXAMPLES[placeholderIndex]}`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--surface-container)', color: 'var(--text-primary)', fontSize: '1.1rem', transition: 'all 0.3s ease' }}
        />
        <button 
          type="submit"
          style={{ padding: '0 2rem', borderRadius: '0.5rem', background: 'var(--accent-positive)', color: 'var(--surface)', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s ease' }}
        >
          Analyze
        </button>
      </motion.form>
    </div>
  );
}
