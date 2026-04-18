import { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterX, Download, ThumbsDown, Loader2, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import rawData from '../data.json';
import biData from '../bi_data.json';

const DARK_COLORS = {
  Positive: '#34d399',
  Negative: '#f87171',
  Mixed: '#60a5fa',
  Neutral: '#fbbf24'
};

const LIGHT_COLORS = {
  Positive: '#8b6914',
  Negative: '#b33a2a',
  Mixed: '#5a6e3a',
  Neutral: '#9a7b30'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const isPie = data.name !== 'Negative';
    return (
      <div className="custom-tooltip">
        <p className="label" style={{ color: data.color || 'var(--text-primary)' }}>
          {isPie ? `${data.name} Reviews` : `${label} Negative Feedback`}
        </p>
        <p className="desc">{data.value} total</p>
      </div>
    );
  }
  return null;
};

const categorizeAspect = (feature, product = '') => {
  const f = feature.toLowerCase();
  const p = product.toLowerCase();
  
  const has = (keywords) => keywords.some(kw => f.includes(kw));

  // ── GAMING CONSOLES (PlayStation, Xbox, Switch, etc.) ──
  if (p.includes('playstation') || p.includes('ps5') || p.includes('xbox') || p.includes('nintendo') || p.includes('switch')) {
    if (has(['graphic', 'visual', 'ray trac', 'resolution', 'fps', '4k', 'hdr', 'render'])) return "Graphics";
    if (has(['controller', 'dualsense', 'joystick', 'drift', 'stick', 'haptic', 'trigger', 'button', 'r2', 'l2'])) return "Controller";
    if (has(['storage', 'ssd', 'hard drive', 'space', 'gb', '800'])) return "Storage";
    if (has(['cool', 'fan', 'overheat', 'thermal', 'jet engine', 'loud', 'noise', 'temp'])) return "Thermals/Noise";
    if (has(['price', 'cost', 'expensive', 'money', 'value', 'overpriced', 'worth', 'goug'])) return "Pricing";
    if (has(['game', 'exclusive', 'title', 'library', 'launch'])) return "Game Library";
    if (has(['load', 'speed', 'perform', 'fast', 'lag', 'smooth', 'frame'])) return "Performance";
    if (has(['disc', 'drive', 'digital', 'physical'])) return "Disc Drive";
    if (has(['design', 'size', 'look', 'build', 'bulky', 'heavy', 'weight', 'aesthetic'])) return "Design/Build";
    if (has(['software', 'ui', 'update', 'os', 'interface', 'bug', 'crash'])) return "Software/UI";
    if (has(['audio', 'sound', 'speaker', '3d audio', 'headset'])) return "Audio";
    if (has(['online', 'network', 'wifi', 'connect', 'download', 'psn', 'multiplayer'])) return "Online/Network";
    return "General";
  }

  // ── FOOD & BEVERAGE (Lays, Tropicana, etc.) ──
  if (p.includes('lays') || p.includes('juice') || p.includes('tropicana')) {
    if (has(['taste', 'flavour', 'flavor', 'sweet', 'salt', 'spice', 'tangy', 'sour', 'bitter', 'masala', 'cream'])) return "Taste/Flavour";
    if (has(['texture', 'crunch', 'crisp', 'oil', 'greas', 'thick', 'thin', 'soggy', 'stale'])) return "Texture/Form";
    if (has(['packet', 'packaging', 'quantity', 'seal', 'bottle', 'cap', 'air', 'less'])) return "Packaging/Quantity";
    if (has(['quality', 'fresh', 'natural', 'authentic', 'ingredi', 'preserv', 'color', 'artificial'])) return "Quality/Freshness";
    if (has(['price', 'cost', 'money', 'value', 'expensive', 'cheap', 'worth', 'paisa'])) return "Pricing";
    if (has(['health', 'calorie', 'fat', 'sugar', 'nutrition', 'diet'])) return "Health/Nutrition";
    return "Quality/Freshness";
  }

  // ── SKINCARE (Mamaearth, sunscreen, etc.) ──
  if (p.includes('sunscreen') || p.includes('mamaearth') || p.includes('cream') || p.includes('lotion')) {
    if (has(['skin', 'glow', 'white cast', 'cast', 'blend', 'absorb', 'sticky', 'greasy', 'sweat', 'protect', 'sun', 'spf'])) return "Effectiveness/Feel";
    if (has(['packaging', 'tube', 'pump', 'bottle', 'cap', 'leak', 'quantity'])) return "Packaging";
    if (has(['smell', 'fragrance', 'scent'])) return "Fragrance";
    if (has(['quality', 'ingredi', 'natural', 'chemical', 'organic'])) return "Quality/Ingredients";
    if (has(['price', 'cost', 'money', 'value', 'expensive', 'cheap', 'worth'])) return "Pricing";
    return "Effectiveness/Feel";
  }

  // ── GENERIC TECH PRODUCTS ──
  if (has(['display', 'screen', 'oled', 'vivid', 'notch', 'brightness', 'refresh'])) return "Display";
  if (has(['graphic', 'gpu', 'render', 'visual'])) return "Graphics";
  if (has(['perform', 'speed', 'lag', 'smooth', 'fast', 'slow', 'processor', 'chip', 'ram'])) return "Performance";
  if (has(['battery', 'power', 'range', 'drain', 'charging', 'charge', 'backup'])) return "Battery";
  if (has(['audio', 'sound', 'mic', 'anc', 'bass', 'noise', 'speaker'])) return "Audio";
  if (has(['cool', 'fan', 'heat', 'overheat', 'thermal', 'warm', 'hot', 'temp'])) return "Thermals";
  if (has(['comfort', 'weight', 'size', 'ergonomic', 'heavy', 'light', 'cushion', 'lumbar'])) return "Ergonomics";
  if (has(['build', 'design', 'durability', 'hinge', 'frame', 'look', 'premium', 'plastic', 'metal'])) return "Build/Design";
  if (has(['software', 'app', 'os', 'update', 'bug', 'glitch', 'crash'])) return "Software";
  if (has(['connect', 'wifi', 'bluetooth', 'network'])) return "Connectivity";
  if (has(['controller', 'drift', 'keyboard', 'trackpad', 'mouse', 'click', 'pencil', 'input'])) return "Input";
  if (has(['storage', 'ssd', 'space', 'memory'])) return "Storage";
  if (has(['sensor', 'laser', 'attachment', 'port', 'usb', 'cable', 'motor', 'suction'])) return "Hardware";
  if (has(['use', 'clean', 'learn', 'easy', 'hard', 'setup', 'maintenance'])) return "Usability";
  if (has(['price', 'cost', 'money', 'value', 'expensive', 'cheap', 'worth'])) return "Pricing";
  if (has(['camera', 'photo', 'video', 'lens', 'selfie'])) return "Camera";
  if (has(['service', 'delivery', 'support', 'customer', 'warranty', 'return'])) return "Service/Support";

  return feature.charAt(0).toUpperCase() + feature.slice(1);
};

const isSarcastic = (text, emotion) => {
  if (!text || !emotion.includes('Negative')) return false;
  const t = text.toLowerCase();
  const posWords = ['love', 'perfect', 'great', 'best', 'brilliant', 'wow', 'amazing', 'excellent', 'fantastic', 'genius'];
  return posWords.some(w => t.includes(w));
};

function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const selectedProduct = searchParams.get('product') || 'All Products';
  const { theme } = useTheme();
  const { user } = useAuth();
  const COLORS = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  const [enterpriseProducts, setEnterpriseProducts] = useState([]);

  useEffect(() => {
    if (user?.enterpriseId) {
      fetch(`http://localhost:8001/api/products/${user.enterpriseId}`)
        .then(res => res.json())
        .then(data => setEnterpriseProducts(data.products || []))
        .catch(err => console.error("Failed to fetch enterprise products", err));
    }
  }, [user]);

  const [localReviews, setLocalReviews] = useState(() => {
    return rawData.reviews.map(r => ({
      ...r,
      emotion: r.emotion?.replace(' (Cached)', '') || 'Neutral'
    }));
  });
  const [reanalyzingId, setReanalyzingId] = useState(null);
  
  const allReviews = localReviews;

  const [selectedSlice, setSelectedSlice] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const isMatch = (dataProd, searchProd) => {
    if (!searchProd || searchProd === 'All Products') return true;
    const dp = dataProd.toLowerCase();
    const sp = searchProd.toLowerCase().trim();
    
    if (dp === sp || dp.includes(sp) || sp.includes(dp)) return true;
    if (sp.includes('topicana') && dp.includes('tropicana')) return true;
    
    // Split search into words and check if all words are in the data product
    const searchWords = sp.split(/\s+/).filter(w => w.length > 0);
    return searchWords.every(word => dp.includes(word));
  };

  const isEnterprise = !!user?.enterpriseId;

  const filteredAllReviews = useMemo(() => {
    if (!isEnterprise) return allReviews;
    if (enterpriseProducts.length === 0) return [];
    return allReviews.filter(r => enterpriseProducts.some(ep => isMatch(r.product, ep)));
  }, [allReviews, isEnterprise, enterpriseProducts]);

  const filteredBiData = useMemo(() => {
    if (!isEnterprise) return biData;
    if (enterpriseProducts.length === 0) return [];
    return biData.filter(d => enterpriseProducts.some(ep => isMatch(d.product, ep)));
  }, [isEnterprise, enterpriseProducts]);

  // Filter reviews by product
  const productReviews = useMemo(() => {
    return selectedProduct === 'All Products' 
      ? filteredAllReviews 
      : filteredAllReviews.filter(r => isMatch(r.product, selectedProduct));
  }, [selectedProduct, filteredAllReviews]);

  // Filter BI data by product
  const productBIData = useMemo(() => {
    return selectedProduct === 'All Products'
      ? filteredBiData
      : filteredBiData.filter(d => isMatch(d.product, selectedProduct));
  }, [selectedProduct, filteredBiData]);

  // Compute pie chart data
  const pieData = useMemo(() => {
    const counts = { Positive: 0, Negative: 0, Mixed: 0, Neutral: 0 };
    productReviews.forEach(r => {
      if (r.emotion.includes('Positive')) counts.Positive++;
      else if (r.emotion.includes('Negative')) counts.Negative++;
      else if (r.emotion.includes('Mixed')) counts.Mixed++;
      else counts.Neutral++;
    });

    return Object.keys(counts)
      .filter(key => counts[key] > 0)
      .map(key => ({
        name: key,
        value: counts[key]
      }));
  }, [productReviews]);

  // Final reviews shown based on slice click and issue click
  const displayedReviews = useMemo(() => {
    let filtered = productReviews;
    if (selectedSlice) {
      filtered = filtered.filter(r => {
        if (selectedSlice === 'Positive') return r.emotion.includes('Positive');
        if (selectedSlice === 'Negative') return r.emotion.includes('Negative');
        if (selectedSlice === 'Mixed') return r.emotion.includes('Mixed');
        if (selectedSlice === 'Neutral') return !r.emotion.includes('Positive') && !r.emotion.includes('Negative') && !r.emotion.includes('Mixed');
        return true;
      });
    }
    if (selectedIssue) {
      filtered = filtered.filter(r => {
        if (!r.aspects) return false;
        return r.aspects.some(a => 
          a.sentiment.toLowerCase() === 'negative' && 
          categorizeAspect(a.feature, r.product) === selectedIssue
        );
      });
    }
    return filtered;
  }, [productReviews, selectedSlice, selectedIssue]);

  // Compute timeline data for negative reviews broken down by issue
  const { timelineData, uniqueIssues } = useMemo(() => {
    const monthCounts = {};
    const issuesSet = new Set();

    // First pass: Find all unique negative issues
    productReviews.forEach(r => {
      if (r.emotion?.includes('Negative') && r.aspects) {
        r.aspects.forEach(aspect => {
          if (aspect.sentiment.toLowerCase() === 'negative') {
            issuesSet.add(categorizeAspect(aspect.feature, r.product));
          }
        });
      }
    });

    const uniqueArray = Array.from(issuesSet);

    // Second pass: Initialize all months with all issues set to 0, then increment
    productReviews.forEach(r => {
      if (r.emotion?.includes('Negative') && r.aspects) {
        const parts = r.date.split(' ');
        if (parts.length >= 3) {
          const monthYear = `${parts[1].substring(0,3)} ${parts[2]}`;
          const monthIndex = new Date(r.date).getMonth();
          const sortKey = `${parts[2]}-${String(monthIndex + 1).padStart(2, '0')}`;
          
          if (!monthCounts[sortKey]) {
            monthCounts[sortKey] = { name: monthYear };
            uniqueArray.forEach(issue => {
              monthCounts[sortKey][issue] = 0; // Explicitly map absent values to 0
            });
          }
          
          r.aspects.forEach(aspect => {
            if (aspect.sentiment.toLowerCase() === 'negative') {
              const cluster = categorizeAspect(aspect.feature, r.product);
              monthCounts[sortKey][cluster]++;
            }
          });
        }
      }
    });

    const sortedData = Object.keys(monthCounts)
      .sort()
      .map(k => monthCounts[k]);
      
    return { timelineData: sortedData, uniqueIssues: uniqueArray };
  }, [productReviews]);

  const LINE_COLORS = theme === 'light' 
    ? ['#b33a2a', '#8b6914', '#5a6e3a', '#9a7b30', '#7c5e3c', '#a0522d', '#6b8e23', '#8b7355', '#c0392b', '#7f8c8d']
    : ['#f87171', '#34d399', '#60a5fa', '#fbbf24', '#c084fc', '#fb7185', '#2dd4bf', '#facc15', '#ff6b9d', '#94a3b8'];

  const handlePieClick = (data) => {
    const name = data.name || data.value;
    if (selectedSlice === name) {
      setSelectedSlice(null);
    } else {
      setSelectedSlice(name);
    }
  };

  const handleLegendClick = (e) => {
    if (!e || !e.dataKey) return;
    setSelectedIssue(prev => prev === e.dataKey ? null : e.dataKey);
  };

  const handleRowClick = (issue) => {
    setSelectedIssue(prev => prev === issue ? null : issue);
  };

  const handleReanalyze = async (review) => {
    const rId = review.review_id || review.id || review.review_text;
    setReanalyzingId(rId);
    try {
      const response = await fetch('http://localhost:8001/analyze_reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: [review.review_text],
          force_reanalyze: true
        })
      });
      const data = await response.json();
      if (data.reviews_analysis && data.reviews_analysis.length > 0) {
        const newAnalysis = data.reviews_analysis[0];
        setLocalReviews(prev => prev.map(r => 
          (r.review_text === review.review_text) 
            ? { ...r, emotion: newAnalysis.emotion, aspects: newAnalysis.aspects, confidence_score: newAnalysis.confidence_score } 
            : r
        ));
      }
    } catch (err) {
      console.error(err);
    }
    setReanalyzingId(null);
  };

  const exportReport = () => {
    const headers = ['Product', 'Issue Cluster', 'Frequency', 'Severity', 'Intensity', 'Impact Score', 'Est. Cost', 'ROI Score'];
    const rows = productBIData.map(row => [
      `"${row.product}"`,
      `"${row.issue_cluster}"`,
      row.frequency,
      row.severity,
      row.avg_intensity.toFixed(2),
      row.impact_score.toFixed(1),
      row.estimated_cost.toFixed(0),
      row.roi_score.toFixed(3)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cortex_Report_${selectedProduct.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container" style={{ paddingTop: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            Cortex AI Intelligence: {selectedProduct}
          </motion.h1>
          <motion.p 
            className="subtitle"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Interactive BI Dashboard
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={exportReport}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '0.5rem',
            background: 'var(--surface-container)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-positive)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Download size={16} /> Export Report
        </motion.button>
      </header>

      {/* explicitly requested Product and Sentiment Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select 
          value={selectedProduct} 
          onChange={(e) => navigate(`/analysis?product=${encodeURIComponent(e.target.value)}`)}
          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'var(--surface-container)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.95rem', cursor: 'pointer' }}
        >
          <option value="All Products">All Products</option>
          {isEnterprise ? (
            enterpriseProducts.map((p, i) => <option key={i} value={p}>{p}</option>)
          ) : (
            Array.from(new Set(allReviews.map(r => r.product))).map((p, i) => <option key={i} value={p}>{p}</option>)
          )}
        </select>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-container-low)', padding: '0.25rem', borderRadius: '0.6rem', border: '1px solid var(--glass-border)' }}>
          {['All', 'Positive', 'Negative', 'Neutral', 'Mixed'].map(sent => {
            const isActive = (sent === 'All' && !selectedSlice) || selectedSlice === sent;
            return (
              <button
                key={sent}
                onClick={() => setSelectedSlice(sent === 'All' ? null : sent)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {sent}
              </button>
            )
          })}
        </div>
      </div>

        {/* Analytics Dashboard */}
        <div className="dashboard-grid">
          {/* Chart Section */}
          <motion.div 
            className="chart-container glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Sentiment Breakdown</h2>
            <p className="chart-hint">Click a slice to filter reviews below</p>
            
            <div className="pie-wrapper">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend onClick={handlePieClick} verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ cursor: 'pointer' }} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={0}
                    outerRadius={130}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    strokeWidth={0}
                    onClick={handlePieClick}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    cursor="pointer"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.name]} 
                        className={`pie-slice ${selectedSlice === entry.name ? 'selected-slice' : ''} ${selectedSlice && selectedSlice !== entry.name ? 'dimmed-slice' : ''}`}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Metrics Section */}
          <div className="metrics-column">
            <div className="metric-card main-metric">
              <div className="metric-value">{productReviews.length}</div>
              <div className="metric-label">Total Reviews</div>
            </div>
            
            {pieData.map(stat => (
              <div 
                key={stat.name} 
                className={`metric-card small-metric ${selectedSlice === stat.name ? 'active-metric' : ''}`}
                style={{ borderColor: `rgba(${COLORS[stat.name].replace('#', '')}, 0.3)` }}
                onClick={() => handlePieClick(stat)}
              >
                <div className="metric-val" style={{ color: COLORS[stat.name] }}>{stat.value}</div>
                <div className="metric-lbl">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Trends Section */}
        <motion.div 
          className="glass-panel" 
          style={{ marginBottom: '4rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="reviews-header" style={{ marginBottom: '1rem', borderBottom: 'none' }}>
            <h3>Problem Trajectory</h3>
            <span className="count-badge" style={{ background: 'var(--accent-negative-bg)', color: 'var(--accent-negative)' }}>Negative Feedback Volume</span>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} dy={10} axisLine={{ stroke: 'var(--glass-border)' }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} dx={-10} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-container)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px var(--shadow-ambient)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600', padding: '2px 0' }}
                  labelStyle={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Legend onClick={handleLegendClick} verticalAlign="top" height={40} wrapperStyle={{ fontSize: '11px', fontWeight: '600', cursor: 'pointer' }} iconType="circle" iconSize={8} />
                {uniqueIssues.map((issue, idx) => {
                  const isFaded = selectedIssue && selectedIssue !== issue;
                  return (
                    <Area 
                      key={issue}
                      type="monotone" 
                      dataKey={issue} 
                      stackId="1"
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
                      fill={LINE_COLORS[idx % LINE_COLORS.length]} 
                      strokeWidth={isFaded ? 0 : 2} 
                      fillOpacity={isFaded ? 0.05 : 0.8}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Business Intelligence Matrix */}
        <section className="bi-section">
          <div className="reviews-header">
            <h3>
              Business Intelligence: ROI Matrix
            </h3>
            <span className="count-badge">Actionable Fixes Ranked by ROI</span>
          </div>
          
          <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
            <table className="bi-table">
              <thead>
                <tr>
                  {selectedProduct === 'All Products' && <th>Product</th>}
                  <th>Issue Cluster</th>
                  <th>Freq.</th>
                  <th>Severity</th>
                  <th>Intensity</th>
                  <th>Impact Score</th>
                  <th>Est. Cost ($)</th>
                  <th>ROI Score</th>
                </tr>
              </thead>
              <tbody>
                {productBIData.map((row, idx) => {
                  const isFaded = selectedIssue && selectedIssue !== row.issue_cluster;
                  return (
                  <tr 
                    key={idx} 
                    className="bi-row" 
                    onClick={() => handleRowClick(row.issue_cluster)}
                    style={{ cursor: 'pointer', opacity: isFaded ? 0.3 : 1 }}
                  >
                    {selectedProduct === 'All Products' && <td>{row.product}</td>}
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{row.issue_cluster}</td>
                    <td>{row.frequency}</td>
                    <td>{row.severity}/10</td>
                    <td>{row.avg_intensity.toFixed(2)}</td>
                    <td style={{ color: 'var(--accent-negative)', fontWeight: '700' }}>{row.impact_score.toFixed(1)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>${row.estimated_cost.toFixed(0)}</td>
                    <td>
                      <span className="roi-badge" data-level={row.roi_score > 0.15 ? 'high' : row.roi_score > 0.05 ? 'med' : 'low'}>
                        {row.roi_score.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                )})}
                {productBIData.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No actionable BI data for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="reviews-section">
          <div className="reviews-header">
            <h3>
              {selectedSlice ? `${selectedSlice} Reviews` : 'All Reviews'} 
              <span className="count-badge">{displayedReviews.length}</span>
            </h3>
            
            <AnimatePresence>
              {(selectedSlice || selectedIssue) && (
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="clear-filter-btn"
                  onClick={() => { setSelectedSlice(null); setSelectedIssue(null); }}
                >
                  <FilterX size={16} /> Clear Filters
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.div layout className="reviews-grid">
            <AnimatePresence mode='popLayout'>
              {displayedReviews.map((r, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  key={idx + r.review_text.substring(0,10)} 
                  whileHover={{ y: -5, boxShadow: '0 15px 35px -10px rgba(0,0,0,0.2)' }}
                  className="review-card" 
                  data-emotion={r.emotion}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: `radial-gradient(circle at top right, ${COLORS[r.emotion] || 'var(--accent-positive)'}, transparent 70%)`, opacity: 0.1, pointerEvents: 'none' }} />
                  
                  <div className="card-header" style={{ position: 'relative', zIndex: 1 }}>
                    <div>
                      <div className="product-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {r.product}
                        {isSarcastic(r.review_text, r.emotion) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'var(--accent-negative-bg)', color: 'var(--accent-negative)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                            <Sparkles size={10} /> SARCASM DETECTED
                          </div>
                        )}
                      </div>
                      <div className="meta-info">
                        <span>{r.location}</span> • <span>{r.date}</span>
                      </div>
                    </div>
                    <div className="emotion-badge">{r.emotion}</div>
                  </div>
                  
                  <div className="review-text" style={{ position: 'relative', zIndex: 1 }}>
                    "{r.review_text}"
                  </div>
                  
                  {r.aspects && r.aspects.length > 0 && (
                    <div className="aspects-container" style={{ position: 'relative', zIndex: 1 }}>
                      {r.aspects.map((aspect, i) => (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={i} className="aspect-tag">
                          <div className={`aspect-dot ${aspect.sentiment.toLowerCase()}`}></div>
                          {aspect.feature}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)', position: 'relative', zIndex: 1 }}>
                    <div className="confidence">
                      {(r.confidence_score * 100).toFixed(0)}% AI Confidence
                    </div>
                    <button 
                      onClick={() => handleReanalyze(r)}
                      disabled={reanalyzingId === (r.review_id || r.id || r.review_text)}
                      style={{ 
                        background: 'transparent', border: '1px solid var(--glass-border)', padding: '0.35rem 0.75rem', 
                        borderRadius: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', 
                        alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
                        opacity: reanalyzingId === (r.review_id || r.id || r.review_text) ? 0.7 : 1
                      }}
                      onMouseEnter={e => { if(!e.currentTarget.disabled){ e.currentTarget.style.color = 'var(--accent-negative)'; e.currentTarget.style.borderColor = 'var(--accent-negative)'; e.currentTarget.style.background = 'var(--accent-negative-bg)'; } }}
                      onMouseLeave={e => { if(!e.currentTarget.disabled){ e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'transparent'; } }}
                    >
                      {reanalyzingId === (r.review_id || r.id || r.review_text) ? <Loader2 size={14} className="spin" /> : <ThumbsDown size={14} />}
                      {reanalyzingId === (r.review_id || r.id || r.review_text) ? 'Re-analyzing...' : 'Flag Incorrect'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
  )
}

export default Analysis;
