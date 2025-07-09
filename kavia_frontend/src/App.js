import React, { useState, useEffect } from 'react';
import './App.css';

// BRAND COLORS
const COLORS = {
  primary: '#0047AB',
  secondary: '#E0E7EF',
  accent: '#FF7F32',
};

/**
 * Metric table columns and user-facing labels.
 */
const COLUMNS = [
  { key: 'app_name', label: 'App Name' },
  { key: 'elapsed_time', label: 'Elapsed Time' },
  { key: 'total_cost', label: 'Total Cost' },
  { key: 'date', label: 'Date' },
  { key: 'project_link', label: 'Project Link' },
  { key: 'cga_version', label: 'CGA Version' },
  { key: 'model', label: 'Model' },
  { key: 'streaming', label: 'Streaming' }
];

// Returns the backend URL, defaulting to same host but port 8000.
function getApiBaseUrl() {
  if (process.env.REACT_APP_API_BASE_URL) return process.env.REACT_APP_API_BASE_URL;
  // Assume backend on port 8000; replace as needed for deployment
  return window.location.origin.replace('3000', '8000');
}

// PUBLIC_INTERFACE
function App() {
  // Theme state
  const [theme, setTheme] = useState('light');
  // Metrics state
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  // Filtering and sorting
  const [filter, setFilter] = useState({});
  const [sortKey, setSortKey] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  // Entry detail
  const [selectedId, setSelectedId] = useState(null);
  const [entryDetail, setEntryDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch metrics
  useEffect(() => {
    setLoading(true);
    setFetchError('');
    fetch(`${getApiBaseUrl()}/metrics`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return res.json();
      })
      .then(data => {
        setMetrics(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setFetchError('Failed to load metric data');
        setLoading(false);
      });
  }, []);

  // Fetch detail view if selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setEntryDetail(null);
      setDetailError('');
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    fetch(`${getApiBaseUrl()}/metrics/${encodeURIComponent(selectedId)}`)
      .then(res => {
        if (!res.ok) throw new Error('Detail view not found');
        return res.json();
      })
      .then(data => {
        setEntryDetail(data);
        setDetailLoading(false);
      })
      .catch(() => {
        setDetailError('Failed to fetch detail.');
        setDetailLoading(false);
      });
  }, [selectedId]);

  // Toggle theme
  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  // Handle filter change
  function handleFilterChange(col, value) {
    setFilter({ ...filter, [col]: value });
  }

  // Handle sort column
  function handleSort(col) {
    if (sortKey === col) setSortAsc(a => !a);
    else {
      setSortKey(col);
      setSortAsc(true);
    }
  }

  // Filtered and sorted metrics
  function getDisplayMetrics() {
    let rows = [...metrics];
    // Filtering
    for (const [key, value] of Object.entries(filter)) {
      if (value && value.trim() !== '') {
        rows = rows.filter(item =>
          (String(item[key] ?? '')).toLowerCase().includes(value.trim().toLowerCase())
        );
      }
    }
    // Sorting
    if (sortKey) {
      rows.sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va === vb) return 0;
        if (va === undefined) return 1;
        if (vb === undefined) return -1;
        return (va > vb ? 1 : -1) * (sortAsc ? 1 : -1);
      });
    }
    return rows;
  }

  // Renders table rows
  function TableView() {
    const rows = getDisplayMetrics();
    if (rows.length === 0)
      return <div style={{ color: COLORS.accent, marginTop: 32, fontWeight: 500 }}>No records found.</div>;
    return (
      <table className="dashboard-table">
        <thead>
          <tr>
            {COLUMNS.map(c => (
              <th key={c.key} onClick={() => handleSort(c.key)}>
                <span style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {c.label}
                  {sortKey === c.key ?
                    (sortAsc ? ' ▲' : ' ▼') : ''}
                </span>
              </th>
            ))}
          </tr>
          <tr>
            {COLUMNS.map(c => (
              <th key={c.key}>
                <input
                  className="filter-input"
                  value={filter[c.key] || ''}
                  placeholder="Filter"
                  onChange={e => handleFilterChange(c.key, e.target.value)}
                  style={{ width: '90%' }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id ?? 'row-' + idx}
              onClick={() => setSelectedId(row.id)}
              className="table-row"
              style={{
                background: selectedId === row.id ? COLORS.secondary : undefined,
                cursor: 'pointer',
              }}
            >
              {COLUMNS.map(col =>
                col.key === 'project_link' && row[col.key] ?
                  <td key={col.key}><a
                    href={row[col.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: COLORS.primary, textDecoration: 'underline' }}
                  >Link</a></td> :
                  col.key === 'streaming' ?
                    <td key={col.key} style={{
                      color: row[col.key] ? COLORS.accent : '#999'
                    }}>{row[col.key] ? 'Yes' : 'No'}</td> :
                    <td key={col.key}>{row[col.key] ?? ''}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Renders entry detail view
  function DetailView() {
    if (detailLoading) return (<div className="detail-panel">Loading...</div>);
    if (detailError) return (<div className="detail-panel" style={{ color: COLORS.accent }}>{detailError}</div>);
    if (!entryDetail) return null;
    return (
      <div className="detail-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <h3 style={{ color: COLORS.primary, marginBottom: 8, marginTop: 0 }}>Detail View</h3>
          <button className="close-btn" onClick={() => setSelectedId(null)}>&#10005;</button>
        </div>
        <table style={{ width: '100%', marginTop: 8 }}>
          <tbody>
            {Object.entries(entryDetail).map(([key, value]) => (
              <tr key={key}>
                <td style={{ fontWeight: 500 }}>{COLUMNS.find(c => c.key === key)?.label || key}</td>
                <td>{key === 'project_link' ?
                  <a href={value} target="_blank" rel="noopener noreferrer"
                    style={{ color: COLORS.primary, textDecoration: 'underline' }}>Link</a> :
                  String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="App" style={{ fontFamily: 'Inter,sans-serif' }}>
      <header
        style={{
          width: '100%',
          background: COLORS.primary,
          color: 'white',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0px 1.5px 0px 0px ' + COLORS.secondary
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Placeholder for logo */}
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: COLORS.accent, marginRight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontWeight: 'bold', fontSize: 24, color: COLORS.primary, fontFamily: 'monospace' }}>K</span>
          </div>
          <div>
            <span className="title" style={{ fontSize: 20, fontWeight: 600, letterSpacing: 1 }}>Kavia Metrics Dashboard</span>
            <div className="subtitle" style={{ fontSize: 14, color: COLORS.secondary, fontWeight: 400, opacity: 0.9 }}>Minimal, dynamic app metrics</div>
          </div>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      <main className="main-area" style={{
        display: 'flex',
        flexDirection: 'row',
        maxWidth: 1200,
        margin: '40px auto 0px auto',
        width: '95%',
        minHeight: '60vh',
      }}>
        {/* Table Panel */}
        <div className="table-area" style={{
          flex: 2.2, background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, boxShadow: '0 1.5px 6px #0001'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: COLORS.primary, marginRight: 12 }}>
              Metrics Table
            </span>
            {loading &&
              <span style={{ marginLeft: 18, color: COLORS.accent, fontWeight: 500 }}>Loading...</span>}
            {fetchError &&
              <span style={{ color: COLORS.accent, marginLeft: 12 }}>{fetchError}</span>}
            <span style={{ fontSize: 13, color: '#888', marginLeft: 'auto' }}>
              {metrics.length > 0 ? `${metrics.length} total entries` : ''}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <TableView />
          </div>
          <div className="dashboard-footer" style={{ marginTop: 30, opacity: 0.7, fontSize: 13, color: '#666' }}>
            &copy; {new Date().getFullYear()} Kavia Metrics &mdash; Modern minimal dashboard.
          </div>
        </div>
        {/* Details Panel (shown on desktop, overlays on mobile) */}
        {selectedId &&
          <div className="detail-area" style={{
            flex: 1, minWidth: 270, maxWidth: '32vw',
            marginLeft: 28,
            background: 'var(--bg-secondary)',
            borderRadius: 12, padding: 14, boxShadow: '0 2px 6px #0002',
            zIndex: 10,
            alignSelf: 'flex-start',
            transition: 'all 0.22s'
          }}>
            <DetailView />
          </div>
        }
      </main>
      {/* Detail panel overlay for mobile */}
      {selectedId &&
        <div
          className="detail-overlay"
          style={{
            display: 'none',
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#000A', zIndex: 999,
            justifyContent: 'center', alignItems: 'center'
          }}>
          {/* For custom mobile modal, override display via CSS media query */}
        </div>
      }
    </div>
  );
}

export default App;
