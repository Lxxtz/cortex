import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import rawData from '../data.json';

export default function Feed() {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const product = searchParams.get('product') || '';

  const [reviews, setReviews] = useState(() => {
    const isMatch = (dataProd, searchProd) => {
      if (!searchProd) return true;
      const dp = dataProd.toLowerCase();
      const sp = searchProd.toLowerCase().trim();
      
      if (dp === sp || dp.includes(sp) || sp.includes(dp)) return true;
      if (sp.includes('topicana') && dp.includes('tropicana')) return true;
      
      // Split search into words and check if all words are in the data product
      const searchWords = sp.split(/\s+/).filter(w => w.length > 0);
      return searchWords.every(word => dp.includes(word));
    };

    // Exact or partial match
    const matching = rawData.reviews.filter(r => isMatch(r.product, product));
    return matching.map((r, idx) => ({
      id: idx, // Use array index as ID
      product: r.product,
      date: r.date,
      location: r.location,
      review_text: r.review_text,
      // Strip LLM data to simulate live processing
      emotion: null,
      confidence_score: null,
      aspects: null,
      analyzing: true
    }));
  });

  const [isProcessing, setIsProcessing] = useState(reviews.length > 0);

  useEffect(() => {
    if (!reviews.length) return;
    
    let isCancelled = false;

    const processInChunks = async () => {
      setIsProcessing(true);
      const CHUNK_SIZE = 8; // Process 8 reviews at a time
      const unanalyzed = reviews.filter(r => r.analyzing);
      
      for (let i = 0; i < unanalyzed.length; i += CHUNK_SIZE) {
        if (isCancelled) break;
        
        const chunk = unanalyzed.slice(i, i + CHUNK_SIZE);
        const reviewTexts = chunk.map(r => r.review_text);
        
        try {
          const res = await fetch('http://localhost:8001/analyze_reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: reviewTexts })
          });
          const data = await res.json();
          
          if (!isCancelled && data && data.reviews_analysis) {
            setReviews(prev => {
              const next = [...prev];
              data.reviews_analysis.forEach((analysis, idx) => {
                const targetId = chunk[idx].id;
                const targetIndex = next.findIndex(r => r.id === targetId);
                if (targetIndex !== -1) {
                  next[targetIndex] = {
                    ...next[targetIndex],
                    emotion: analysis.emotion,
                    confidence_score: analysis.confidence_score,
                    aspects: analysis.aspects,
                    analyzing: false
                  };
                }
              });
              return next;
            });
          }
        } catch (err) {
          console.error("Analysis failed:", err);
          if (!isCancelled) {
            setReviews(prev => {
              const next = [...prev];
              chunk.forEach(c => {
                const targetIndex = next.findIndex(r => r.id === c.id);
                if (targetIndex !== -1) {
                  next[targetIndex] = { ...next[targetIndex], analyzing: false, emotion: "Error" };
                }
              });
              return next;
            });
          }
        }
      }
      if (!isCancelled) setIsProcessing(false);
    };

    processInChunks();

    return () => {
      isCancelled = true;
    };
  }, [product]); // Only run on mount or product change

  const [marketingReports, setMarketingReports] = useState([]);
  
  useEffect(() => {
    if (isProcessing) return;
    
    const aspectScores = {};
    reviews.forEach(r => {
      if (r.aspects) {
        r.aspects.forEach(a => {
          const f = a.feature.toLowerCase();
          if (!aspectScores[f]) aspectScores[f] = { pos: 0, neg: 0 };
          
          if (a.sentiment.toLowerCase() === 'positive') {
            aspectScores[f].pos += 1;
          } else if (a.sentiment.toLowerCase() === 'negative') {
            aspectScores[f].neg += 1;
          }
        });
      }
    });
    
    const reports = [];
    const sortedPos = Object.entries(aspectScores)
      .map(([feature, counts]) => ({ feature, netScore: counts.pos - counts.neg, pos: counts.pos }))
      .filter(item => item.netScore > 0)
      .sort((a,b) => b.netScore - a.netScore);

    const sortedNeg = Object.entries(aspectScores)
      .map(([feature, counts]) => ({ feature, negScore: counts.neg - counts.pos, neg: counts.neg }))
      .filter(item => item.negScore > 0)
      .sort((a,b) => b.negScore - a.negScore);

    if (sortedPos.length > 0) {
      reports.push({
        type: 'highlight',
        title: 'Core Value Campaign',
        feature: sortedPos[0].feature,
        score: sortedPos[0].netScore,
        desc: `Our live semantic analysis identifies that ${sortedPos[0].feature} has the highest net positive sentiment. Launch a targeted campaign positioning this as the core value proposition.`
      });
    }

    if (sortedPos.length > 1) {
      reports.push({
        type: 'secondary',
        title: 'Secondary Feature Spotlight',
        feature: sortedPos[1].feature,
        score: sortedPos[1].netScore,
        desc: `High receptivity found for ${sortedPos[1].feature}. Consider running A/B tested social media ads highlighting this secondary strength.`
      });
    }

    if (sortedNeg.length > 0) {
      reports.push({
        type: 'reeducation',
        title: 'Re-education Opportunity',
        feature: sortedNeg[0].feature,
        score: sortedNeg[0].negScore,
        desc: `High friction detected regarding ${sortedNeg[0].feature}. Launch a "How-to" or clarification campaign to address user misconceptions and improve sentiment.`
      });
    }

    setMarketingReports(reports);
  }, [reviews, isProcessing]);

  return (
    <div className="app-container" style={{ paddingTop: '1rem' }}>
      <header>
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          Live Review Feed: {product}
        </motion.h1>
        <motion.p className="subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {isProcessing ? 'Analyzing semantics in real-time via Cortex AI...' : 'Analysis Complete'}
        </motion.p>
      </header>

      {user?.role === 'marketing' && !isProcessing && marketingReports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {marketingReports.map((report, idx) => (
            <motion.div 
              key={idx}
              className="glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{ 
                borderLeft: `4px solid ${report.type === 'reeducation' ? 'var(--accent-negative)' : report.type === 'secondary' ? 'var(--accent-mixed)' : 'var(--accent-positive)'}` 
              }}
            >
              <h3 style={{ 
                color: report.type === 'reeducation' ? 'var(--accent-negative)' : report.type === 'secondary' ? 'var(--accent-mixed)' : 'var(--accent-positive)', 
                marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' 
              }}>
                {report.title}
              </h3>
              <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Focus: {report.feature.charAt(0).toUpperCase() + report.feature.slice(1)} (Impact: {report.score})
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.9rem' }}>
                {report.desc}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
          No reviews found for "{product}". Try "MacBook" or "Samsung".
        </div>
      )}

      <section className="reviews-section">
        <div className="reviews-header">
          <h3>Raw Input Feed <span className="count-badge">{reviews.length}</span></h3>
        </div>

        <motion.div layout className="reviews-grid">
          <AnimatePresence mode="popLayout">
            {reviews.map((r) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={r.id} 
                className={`review-card ${r.analyzing ? 'pulse' : ''}`} 
                data-emotion={r.emotion || 'Processing'}
              >
                <div className="card-header">
                  <div>
                    <div className="product-name">{r.product}</div>
                    <div className="meta-info">
                      <span>{r.location}</span> • <span>{r.date}</span>
                    </div>
                  </div>
                  <div className="emotion-badge">
                    {r.analyzing ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="spinner"></span> Processing...
                      </span>
                    ) : r.emotion}
                  </div>
                </div>
                
                <div className="review-text">
                  "{r.review_text}"
                </div>
                
                {!r.analyzing && r.aspects && r.aspects.length > 0 && (
                  <div className="aspects-container" style={{ marginTop: '1rem' }}>
                    {r.aspects.map((aspect, i) => (
                      <div key={i} className="aspect-tag">
                        <div className={`aspect-dot ${aspect.sentiment.toLowerCase()}`}></div>
                        {aspect.feature}
                      </div>
                    ))}
                  </div>
                )}
                
                {!r.analyzing && r.confidence_score && (
                  <div className="confidence" style={{ marginTop: '1rem' }}>
                    {(r.confidence_score * 100).toFixed(0)}% AI Confidence
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
      
      {/* Basic Spinner CSS */}
      <style>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--glass-border);
          border-radius: 50%;
          border-top-color: var(--text-primary);
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .pulse {
          animation: pulse-bg 2s infinite;
        }
        @keyframes pulse-bg {
          0% { box-shadow: 0 0 0 0 var(--accent-mixed-bg); }
          50% { box-shadow: 0 0 0 4px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </div>
  );
}
