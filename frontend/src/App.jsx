import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterX } from 'lucide-react';
import rawData from './data.json';

const COLORS = {
  Positive: '#00e676',
  Negative: '#ff3d00',
  Mixed: '#b388ff',
  Neutral: '#ffea00'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="label" style={{ color: COLORS[data.name] }}>{data.name} Reviews</p>
        <p className="desc">{data.value} total</p>
        <p className="hint">Click to view these reviews</p>
      </div>
    );
  }
  return null;
};

function App() {
  const allReviews = useMemo(() => {
    return rawData.reviews.map(r => ({
      ...r,
      emotion: r.emotion?.replace(' (Cached)', '') || 'Neutral'
    }));
  }, []);

  const products = useMemo(() => {
    const prodSet = new Set(allReviews.map(r => r.product));
    return ['All Products', ...Array.from(prodSet)];
  }, [allReviews]);

  const [selectedProduct, setSelectedProduct] = useState('All Products');
  const [selectedSlice, setSelectedSlice] = useState(null);

  // Filter reviews by product
  const productReviews = useMemo(() => {
    return selectedProduct === 'All Products' 
      ? allReviews 
      : allReviews.filter(r => r.product === selectedProduct);
  }, [selectedProduct, allReviews]);

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

  // Final reviews shown based on slice click
  const displayedReviews = useMemo(() => {
    if (!selectedSlice) return productReviews;
    return productReviews.filter(r => {
      if (selectedSlice === 'Positive') return r.emotion.includes('Positive');
      if (selectedSlice === 'Negative') return r.emotion.includes('Negative');
      if (selectedSlice === 'Mixed') return r.emotion.includes('Mixed');
      if (selectedSlice === 'Neutral') return !r.emotion.includes('Positive') && !r.emotion.includes('Negative') && !r.emotion.includes('Mixed');
      return true;
    });
  }, [productReviews, selectedSlice]);

  const handlePieClick = (data) => {
    // Toggle filter
    if (selectedSlice === data.name) {
      setSelectedSlice(null);
    } else {
      setSelectedSlice(data.name);
    }
  };

  return (
    <>
      <div className="bg-glow"></div>
      <div className="bg-glow-2"></div>
      
      <div className="app-container">
        <header>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            Cortex AI Insights
          </motion.h1>
          <motion.p 
            className="subtitle"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Interactive Semantic Feedback Analysis
          </motion.p>
        </header>

        {/* Product Selector */}
        <section className="product-selector">
          {products.map(prod => (
            <button
              key={prod}
              className={`product-btn ${selectedProduct === prod ? 'active' : ''}`}
              onClick={() => {
                setSelectedProduct(prod);
                setSelectedSlice(null); // reset slice filter on product change
              }}
            >
              {prod}
            </button>
          ))}
        </section>

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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    <filter id="bevel" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                      <feOffset dx="-2" dy="-3" result="offsetBlur" />
                      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
                      <feFlood floodColor="#000000" floodOpacity="0.6" />
                      <feComposite in2="shadowDiff" operator="in" />
                      <feComposite in2="SourceGraphic" operator="over" />
                      
                      {/* Massive deep drop shadow for 3D levitation */}
                      <feDropShadow dx="0" dy="15" stdDeviation="10" floodColor="#000000" floodOpacity="0.8" />
                    </filter>
                    
                    <radialGradient id="gradPositive" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#69f0ae" />
                      <stop offset="100%" stopColor="#00c853" />
                    </radialGradient>
                    <radialGradient id="gradNegative" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#ff5252" />
                      <stop offset="100%" stopColor="#d50000" />
                    </radialGradient>
                    <radialGradient id="gradMixed" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#e040fb" />
                      <stop offset="100%" stopColor="#aa00ff" />
                    </radialGradient>
                    <radialGradient id="gradNeutral" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#ffd740" />
                      <stop offset="100%" stopColor="#ffab00" />
                    </radialGradient>
                  </defs>
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={125}
                    cornerRadius={12}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    onClick={handlePieClick}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    cursor="pointer"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#grad${entry.name})`} 
                        filter="url(#bevel)"
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

        {/* Reviews Section */}
        <section className="reviews-section">
          <div className="reviews-header">
            <h3>
              {selectedSlice ? `${selectedSlice} Reviews` : 'All Reviews'} 
              <span className="count-badge">{displayedReviews.length}</span>
            </h3>
            
            <AnimatePresence>
              {selectedSlice && (
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="clear-filter-btn"
                  onClick={() => setSelectedSlice(null)}
                >
                  <FilterX size={16} /> Clear Filter
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
                  className="review-card" 
                  data-emotion={r.emotion}
                >
                  <div className="card-header">
                    <div>
                      <div className="product-name">{r.product}</div>
                      <div className="meta-info">
                        <span>{r.location}</span> • <span>{r.date}</span>
                      </div>
                    </div>
                    <div className="emotion-badge">{r.emotion}</div>
                  </div>
                  
                  <div className="review-text">
                    "{r.review_text}"
                  </div>
                  
                  {r.aspects && r.aspects.length > 0 && (
                    <div className="aspects-container">
                      {r.aspects.map((aspect, i) => (
                        <div key={i} className="aspect-tag">
                          <div className={`aspect-dot ${aspect.sentiment.toLowerCase()}`}></div>
                          {aspect.feature}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="confidence">
                    {(r.confidence_score * 100).toFixed(0)}% AI Confidence
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
    </>
  )
}

export default App;
