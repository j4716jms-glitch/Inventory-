import Head from 'next/head';
import { useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { initialProducts, CATEGORIES } from '../data/products';

// ─── Icons (inline SVGs to avoid extra deps) ─────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const SortAscIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 19V5M5 12l7-7 7 7"/>
  </svg>
);
const SortDescIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12l7 7 7-7"/>
  </svg>
);
const SortNeutralIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.35">
    <path d="M8 9l4-4 4 4M16 15l-4 4-4-4"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    'In Stock':     { bg: 'var(--green-dim)',  color: 'var(--green)',  dot: 'var(--green)' },
    'Low Stock':    { bg: 'var(--yellow-dim)', color: 'var(--yellow)', dot: 'var(--yellow)' },
    'Out of Stock': { bg: 'var(--red-dim)',    color: 'var(--red)',    dot: 'var(--red)' },
  };
  const s = styles[status] || styles['In Stock'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
      fontFamily: "'DM Mono', monospace", letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 22px',
      borderTop: accent ? `2px solid ${accent}` : '1px solid var(--border)',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: accent || 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-secondary)', fontSize: 11.5, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',       label: 'ID',        width: 90,  mono: true },
  { key: 'name',     label: 'Product',   width: 220, mono: false },
  { key: 'category', label: 'Category',  width: 140, mono: false },
  { key: 'sku',      label: 'SKU',       width: 120, mono: true },
  { key: 'stock',    label: 'Stock',     width: 80,  mono: true, align: 'right' },
  { key: 'price',    label: 'Price',     width: 90,  mono: true, align: 'right' },
  { key: 'status',   label: 'Status',    width: 130, mono: false },
  { key: 'supplier', label: 'Supplier',  width: 150, mono: false },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [products] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState({ key: null, dir: null });
  const searchRef = useRef(null);

  // Stats
  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter(p => p.status === 'In Stock').length,
    lowStock: products.filter(p => p.status === 'Low Stock').length,
    outOfStock: products.filter(p => p.status === 'Out of Stock').length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock, 0),
  }), [products]);

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let data = products;
    if (category !== 'All') data = data.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (sort.key && sort.dir) {
      data = [...data].sort((a, b) => {
        let av = a[sort.key], bv = b[sort.key];
        if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
        return sort.dir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return data;
  }, [products, search, category, sort]);

  const handleSort = useCallback((key) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: null };
    });
  }, []);

  // Export to Excel
  const exportExcel = useCallback(() => {
    const rows = filtered.map(p => ({
      'ID': p.id, 'Product Name': p.name, 'Category': p.category,
      'SKU': p.sku, 'Stock': p.stock, 'Price ($)': p.price,
      'Status': p.status, 'Supplier': p.supplier,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [10, 30, 18, 14, 10, 12, 16, 20].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [filtered]);

  // Export to CSV
  const exportCSV = useCallback(() => {
    const header = COLUMNS.map(c => c.label).join(',');
    const rows = filtered.map(p =>
      COLUMNS.map(c => {
        const v = p[c.key];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      }).join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [filtered]);

  const SortIcon = ({ colKey }) => {
    if (sort.key !== colKey) return <SortNeutralIcon />;
    return sort.dir === 'asc' ? <SortAscIcon /> : <SortDescIcon />;
  };

  return (
    <>
      <Head>
        <title>Inventory Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        {/* Top noise texture overlay */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--accent-dim)', border: '1px solid rgba(245,130,10,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <BoxIcon />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Inventory Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4 }}>
                  Product stock & catalog management
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={exportCSV} style={btnStyle('secondary')}>
                <DownloadIcon /> Export CSV
              </button>
              <button onClick={exportExcel} style={btnStyle('primary')}>
                <DownloadIcon /> Export Excel
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard label="Total Products"  value={stats.total}      sub="across all categories" accent="var(--accent)" />
            <StatCard label="In Stock"        value={stats.inStock}    sub={`${Math.round(stats.inStock/stats.total*100)}% of catalog`} accent="var(--green)" />
            <StatCard label="Low Stock"       value={stats.lowStock}   sub="needs reorder soon"    accent="var(--yellow)" />
            <StatCard label="Out of Stock"    value={stats.outOfStock} sub="unavailable items"     accent="var(--red)" />
            <StatCard label="Inventory Value" value={`$${(stats.totalValue).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} sub="total stock value" accent="var(--blue)" />
          </div>

          {/* ── Controls Bar ── */}
          <div style={{
            display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products, SKU, supplier…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={searchInputStyle}
              />
              {search && (
                <button onClick={() => { setSearch(''); searchRef.current?.focus(); }} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', padding: 2, borderRadius: 4,
                  transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.target.closest('button').style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.target.closest('button').style.color = 'var(--text-muted)'}
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                    fontFamily: "'Manrope', sans-serif",
                    background: category === cat ? 'var(--accent-dim)' : 'var(--bg-surface)',
                    color: category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                    borderColor: category === cat ? 'rgba(245,130,10,0.4)' : 'var(--border)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Result count */}
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: "'DM Mono', monospace", marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {filtered.length}/{products.length} items
            </div>
          </div>

          {/* ── Table ── */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-bright)' }}>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: '11px 16px', textAlign: col.align || 'left',
                          color: sort.key === col.key ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                          textTransform: 'uppercase', cursor: 'pointer',
                          whiteSpace: 'nowrap', userSelect: 'none',
                          transition: 'color 0.15s',
                          minWidth: col.width,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {col.label}
                          <SortIcon colKey={col.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>No products found</div>
                        <div style={{ fontSize: 12.5 }}>Try adjusting your search or filter</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product, i) => (
                      <tr
                        key={product.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
                          transition: 'background 0.12s',
                          animation: `fadeSlideIn 0.2s ease ${Math.min(i * 0.02, 0.3)}s both`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)'}
                      >
                        <td style={tdStyle(true)}>{product.id}</td>
                        <td style={{ ...tdStyle(false), fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</td>
                        <td style={tdStyle(false)}>
                          <span style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            padding: '2px 8px', borderRadius: 5, fontSize: 11.5,
                            color: 'var(--text-secondary)',
                          }}>{product.category}</span>
                        </td>
                        <td style={tdStyle(true)}>{product.sku}</td>
                        <td style={{ ...tdStyle(true), textAlign: 'right', color: product.stock === 0 ? 'var(--red)' : product.stock < 20 ? 'var(--yellow)' : 'var(--text-primary)' }}>
                          {product.stock.toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle(true), textAlign: 'right', color: 'var(--accent)' }}>
                          ${product.price.toFixed(2)}
                        </td>
                        <td style={tdStyle(false)}><StatusBadge status={product.status} /></td>
                        <td style={{ ...tdStyle(false), color: 'var(--text-secondary)' }}>{product.supplier}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div style={{
              padding: '10px 16px', borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-elevated)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                Showing <strong style={{ color: 'var(--text-secondary)' }}>{filtered.length}</strong> of <strong style={{ color: 'var(--text-secondary)' }}>{products.length}</strong> products
              </span>
              {(search || category !== 'All') && (
                <button
                  onClick={() => { setSearch(''); setCategory('All'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 11.5, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5 }}>
            Inventory Dashboard · Built with Next.js · Deployed on Vercel
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────────
const searchInputStyle = {
  width: '100%', padding: '9px 36px 9px 36px',
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13.5,
  fontFamily: "'Manrope', sans-serif", outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function btnStyle(variant) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
    fontFamily: "'Manrope', sans-serif",
    ...(variant === 'primary' ? {
      background: 'var(--accent)', color: '#0d0f14', borderColor: 'var(--accent)',
    } : {
      background: 'var(--bg-surface)', color: 'var(--text-secondary)', borderColor: 'var(--border)',
    }),
  };
}

function tdStyle(mono) {
  return {
    padding: '11px 16px', fontSize: mono ? 12.5 : 13.5,
    fontFamily: mono ? "'DM Mono', monospace" : "'Manrope', sans-serif",
    color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  };
}
