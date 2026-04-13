// pages/index.js
import { useState, useEffect, useMemo, useCallback } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const formatRp = (val) => {
  if (val == null || isNaN(val)) return '-'
  const n = Number(val)
  if (n >= 1_000_000_000_000) return `Rp${(n / 1_000_000_000_000).toFixed(1)}T`
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(0)}Jt`
  return `Rp${n.toLocaleString('id-ID')}`
}

const formatNum = (val, dec = 0) => {
  if (val == null || isNaN(val)) return '-'
  return Number(val).toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const fmt2 = (val) => formatNum(val, 2)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function ChangeBadge({ val, suffix = '%' }) {
  const n = Number(val)
  if (isNaN(n)) return <span className={styles.neutral}>-</span>
  const cls = n > 0 ? styles.up : n < 0 ? styles.down : styles.neutral
  const prefix = n > 0 ? '+' : ''
  return <span className={cls}>{prefix}{fmt2(n)}{suffix}</span>
}

function TierBadge({ tier }) {
  const map = { HIGH: styles.tierHigh, MODERATE: styles.tierMod, STRONG: styles.tierStrong, LOW: styles.tierLow }
  return <span className={`${styles.tierBadge} ${map[tier] || styles.tierMod}`}>{tier}</span>
}

function BrokerBadge({ signal }) {
  const map = {
    'Big Acc': styles.brokerBigAcc,
    'Acc': styles.brokerAcc,
    'Small Acc': styles.brokerSmallAcc,
    'Normal Acc': styles.brokerNormalAcc,
    'Neutral': styles.brokerNeutral,
    'Normal Dist': styles.brokerDist,
    'Dist': styles.brokerDist,
    'Big Dist': styles.brokerBigDist,
  }
  return <span className={`${styles.brokerBadge} ${map[signal] || styles.brokerNeutral}`}>{signal || '-'}</span>
}

function ScoreRing({ score }) {
  const s = clamp(Number(score) || 0, 0, 100)
  const color = s >= 70 ? 'var(--c-teal)' : s >= 50 ? 'var(--c-amber)' : 'var(--c-coral)'
  return (
    <div className={styles.scoreRing} style={{ '--ring-color': color, '--ring-pct': `${s}%` }}>
      <span className={styles.scoreNum}>{s}</span>
      <span className={styles.scoreLbl}>skor</span>
    </div>
  )
}

function EntryRow({ label, price, pct, note, color = 'var(--c-teal)' }) {
  return (
    <div className={styles.entryRow}>
      <div className={styles.entryMeta}>
        <span className={styles.entryLbl}>{label}</span>
        {pct != null && <span className={styles.entryPct}>{pct}%</span>}
      </div>
      <span className={styles.entryPrice} style={{ color }}>{price ? `Rp${Number(price).toLocaleString('id-ID')}` : '-'}</span>
      {note && <span className={styles.entryNote}>{note}</span>}
    </div>
  )
}

function IntradayCard({ stock, rank }) {
  const ep = stock.entry_plan || {}
  const acc = stock.accumulation || {}
  const mkt = stock.market_data || {}
  const smc = stock.smc || {}
  const trend = stock.trend || {}
  const score = stock.scoring?.confidence_score ?? 0
  const tier = stock.scoring?.tier ?? 'LOW'

  const dirIcon = { PULLBACK: '↓', MOMENTUM: '→', GAP_UP: '↑' }[ep.entry_direction] || '↓'
  const dirColor = { PULLBACK: 'var(--c-amber)', MOMENTUM: 'var(--c-teal)', GAP_UP: 'var(--c-coral)' }[ep.entry_direction] || 'var(--c-amber)'

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.rankBadge}>#{rank}</span>
          <div>
            <span className={styles.tickerText}>{stock.ticker}</span>
            <span className={styles.companyText}>{stock.company}</span>
          </div>
          <TierBadge tier={tier} />
        </div>
        <ScoreRing score={score} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Close</span>
            <span className={styles.statVal}>Rp{formatNum(mkt.close)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Perubahan</span>
            <ChangeBadge val={mkt.change_pct} />
          </div>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Nilai Transaksi</span>
            <span className={styles.statVal}>{formatRp(mkt.value_today)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Net Foreign</span>
            <ChangeBadge val={acc.net_foreign_today != null ? (acc.net_foreign_today / 1e9).toFixed(2) : null} suffix=' M' />
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.colBlock}>
            <span className={styles.blockTitle}>Broker & Akumulasi</span>
            <BrokerBadge signal={acc.broker_signal} />
            <div className={styles.miniRow}>
              <span>Skor Akumulasi</span>
              <strong>{acc.acc_score ?? '-'}</strong>
            </div>
            <div className={styles.miniRow}>
              <span>MA50</span>
              <strong>Rp{formatNum(trend.ma50)}</strong>
            </div>
            <div className={styles.miniRow}>
              <span>Gap MA50</span>
              <ChangeBadge val={trend.gap_from_ma50_pct} />
            </div>
          </div>
          <div className={styles.colBlock}>
            <span className={styles.blockTitle}>SMC Structure</span>
            <div className={styles.smcGrid}>
              <div className={styles.smcItem}>
                <span className={styles.smcLbl}>Internal</span>
                <span className={styles.smcVal}>{smc.internal_structure || 'NONE'}</span>
              </div>
              <div className={styles.smcItem}>
                <span className={styles.smcLbl}>Swing Bias</span>
                <span className={`${styles.smcVal} ${smc.swing_trend_bias === 'BULLISH' ? styles.up : smc.swing_trend_bias === 'BEARISH' ? styles.down : ''}`}>
                  {smc.swing_trend_bias || 'NEUTRAL'}
                </span>
              </div>
              {smc.ob_zone && (
                <div className={styles.smcItem}>
                  <span className={styles.smcLbl}>OB Zone</span>
                  <span className={styles.smcVal}>{smc.ob_zone}</span>
                </div>
              )}
              {smc.fvg_zone && (
                <div className={styles.smcItem}>
                  <span className={styles.smcLbl}>FVG Zone</span>
                  <span className={styles.smcVal}>{smc.fvg_zone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.entrySection}>
          <div className={styles.entryHeader}>
            <span className={styles.blockTitle}>Entry Plan</span>
            <span className={styles.directionTag} style={{ color: dirColor }}>
              {dirIcon} {ep.entry_direction || 'PULLBACK'}
            </span>
          </div>
          <div className={styles.entryList}>
            <EntryRow label="Entry 1" price={ep.entry_1} pct={ep.entry_1_pct} note={ep.entry_1_note} />
            <EntryRow label="Entry 2" price={ep.entry_2} pct={ep.entry_2_pct} note={ep.entry_2_note} />
            <EntryRow label="Entry 3" price={ep.entry_3} pct={ep.entry_3_pct} note={ep.entry_3_note} />
            <div className={styles.avgEntryRow}>
              <span>Avg Entry</span>
              <strong>Rp{formatNum(ep.average_entry)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.slTpRow}>
          <div className={styles.slBox}>
            <span className={styles.slLbl}>Stop Loss</span>
            <span className={styles.slVal}>Rp{formatNum(ep.sl)}</span>
            <span className={styles.slPct}>-{fmt2(ep.sl_pct_risk)}%</span>
          </div>
          <div className={styles.tpBox}>
            <span className={styles.tpLbl}>TP 1</span>
            <span className={styles.tpVal}>Rp{formatNum(ep.tp1)}</span>
          </div>
          <div className={styles.tpBox}>
            <span className={styles.tpLbl}>TP 2</span>
            <span className={styles.tpVal}>Rp{formatNum(ep.tp2)}</span>
          </div>
          <div className={styles.tpBox}>
            <span className={styles.tpLbl}>TP 3</span>
            <span className={styles.tpVal}>Rp{formatNum(ep.tp3)}</span>
          </div>
          <div className={styles.rrBox}>
            <span className={styles.rrLbl}>R/R</span>
            <span className={styles.rrVal}>{ep.rr_ratio || '-'}</span>
          </div>
        </div>

        {stock.signals?.length > 0 && (
          <div className={styles.signalBox}>
            {stock.signals.map((s, i) => <div key={i} className={styles.signalItem}>{s}</div>)}
          </div>
        )}
        {stock.warnings?.length > 0 && (
          <div className={styles.warningBox}>
            {stock.warnings.map((w, i) => <div key={i} className={styles.warningItem}>{w}</div>)}
          </div>
        )}
      </div>

      <div className={styles.cardFoot}>
        <span>{stock.mode}</span>
        <span>{stock.updated_at}</span>
      </div>
    </div>
  )
}

function AraCard({ stock }) {
  const s = stock.score ?? 0
  const color = s >= 80 ? 'var(--c-teal)' : s >= 60 ? 'var(--c-amber)' : 'var(--c-coral)'

  return (
    <div className={`${styles.card} ${styles.araCard}`}>
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <div>
            <span className={styles.tickerText}>{stock.ticker}</span>
            <span className={styles.companyText}>{stock.company}</span>
          </div>
          <TierBadge tier={stock.score_tier} />
        </div>
        <ScoreRing score={s} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.araPattern}>
          <span className={styles.patternBadge}>{stock.pattern_type}</span>
          <BrokerBadge signal={stock.broker_signal} />
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Close D-1</span>
            <span className={styles.statVal}>Rp{formatNum(stock.d1_close)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Change D-1</span>
            <ChangeBadge val={stock.d1_change_pct} />
          </div>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Vol/MA20</span>
            <span className={styles.statVal}>{fmt2(stock.d1_vol_ratio_ma20)}x</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLbl}>Vol/MA5</span>
            <span className={styles.statVal}>{fmt2(stock.d1_vol_ratio_ma5)}x</span>
          </div>
        </div>

        <div className={styles.araMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLbl}>Upper Wick</span>
            <span className={styles.metricVal}>{fmt2(stock.d1_upper_wick)}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLbl}>Body Pct</span>
            <span className={styles.metricVal}>{fmt2(stock.d1_body_pct)}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLbl}>Close Pos</span>
            <span className={styles.metricVal}>{fmt2(stock.d1_close_pos)}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLbl}>Range Exp</span>
            <span className={styles.metricVal}>{fmt2(stock.d1_range_expansion)}x</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLbl}>MA20</span>
            <span className={styles.metricVal}>Rp{formatNum(stock.ma20)}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLbl}>MA50</span>
            <span className={styles.metricVal}>Rp{formatNum(stock.ma50)}</span>
          </div>
        </div>

        {stock.signals_positive?.length > 0 && (
          <div className={styles.signalBox}>
            {stock.signals_positive.map((s, i) => <div key={i} className={styles.signalItem}>+ {s}</div>)}
          </div>
        )}
        {stock.signals_negative?.length > 0 && (
          <div className={styles.warningBox}>
            {stock.signals_negative.map((s, i) => <div key={i} className={styles.warningItem}>- {s}</div>)}
          </div>
        )}

        <div className={`${styles.warningBox} ${styles.araWarning}`}>
          <span className={styles.warningItem}>{stock.warning}</span>
        </div>
      </div>

      <div className={styles.cardFoot}>
        <span>{stock.up_streak_days > 0 ? `${stock.up_streak_days}d streak` : 'no streak'}</span>
        <span>{stock.generated_at}</span>
      </div>
    </div>
  )
}

function FilterBar({ search, onSearch, sortKey, onSort, filterTier, onFilterTier }) {
  return (
    <div className={styles.filterBar}>
      <input
        type="search"
        placeholder="Cari ticker / nama..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className={styles.searchInput}
      />
      <select value={sortKey} onChange={e => onSort(e.target.value)} className={styles.selectInput}>
        <option value="rank">Urut: Rank</option>
        <option value="score_desc">Urut: Skor ↓</option>
        <option value="change_desc">Urut: Change ↓</option>
        <option value="value_desc">Urut: Nilai ↓</option>
        <option value="rr_desc">Urut: R/R ↓</option>
      </select>
      <select value={filterTier} onChange={e => onFilterTier(e.target.value)} className={styles.selectInput}>
        <option value="">Semua Tier</option>
        <option value="HIGH">HIGH</option>
        <option value="MODERATE">MODERATE</option>
        <option value="LOW">LOW</option>
      </select>
    </div>
  )
}

function AraFilterBar({ search, onSearch, filterPattern, onFilterPattern }) {
  return (
    <div className={styles.filterBar}>
      <input
        type="search"
        placeholder="Cari ticker / nama..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className={styles.searchInput}
      />
      <select value={filterPattern} onChange={e => onFilterPattern(e.target.value)} className={styles.selectInput}>
        <option value="">Semua Pola</option>
        <option value="CONTINUATION">CONTINUATION</option>
        <option value="SILENT_ACCUMULATION">SILENT_ACCUMULATION</option>
        <option value="VOLUME_SPIKE">VOLUME_SPIKE</option>
      </select>
    </div>
  )
}

function SummaryFunnel({ summary }) {
  if (!summary) return null
  const steps = [
    ['Universe', summary.universe],
    ['Likuiditas', summary.after_liquidity],
    ['Akumulasi', summary.after_accumulation],
    ['Trend', summary.after_trend],
    ['SMC', summary.after_smc],
    ['Entry', summary.after_entry],
    ['Final', summary.final],
  ].filter(([, v]) => v != null)

  return (
    <div className={styles.funnel}>
      {steps.map(([label, val], i) => (
        <div key={label} className={styles.funnelStep}>
          <span className={styles.funnelVal}>{formatNum(val)}</span>
          <span className={styles.funnelLbl}>{label}</span>
          {i < steps.length - 1 && <span className={styles.funnelArrow}>›</span>}
        </div>
      ))}
    </div>
  )
}

function TabBar({ active, onChange, counts }) {
  return (
    <div className={styles.tabBar}>
      <button
        className={`${styles.tab} ${active === 'intraday' ? styles.tabActive : ''}`}
        onClick={() => onChange('intraday')}
      >
        Intraday Screening
        <span className={styles.tabCount}>{counts.intraday}</span>
      </button>
      <button
        className={`${styles.tab} ${active === 'ara' ? styles.tabActive : ''}`}
        onClick={() => onChange('ara')}
      >
        Calon ARA
        <span className={styles.tabCount}>{counts.ara}</span>
      </button>
    </div>
  )
}

function IhsgBanner({ ctx }) {
  if (!ctx) return null
  return (
    <div className={styles.ihsgBanner}>
      <div className={styles.ihsgItem}>
        <span className={styles.ihsgLbl}>IHSG</span>
        <span className={styles.ihsgVal}>{formatNum(ctx.ihsg_close)}</span>
      </div>
      <div className={styles.ihsgItem}>
        <span className={styles.ihsgLbl}>Perubahan</span>
        <ChangeBadge val={ctx.ihsg_change_pct} />
      </div>
      <div className={styles.ihsgItem}>
        <span className={styles.ihsgLbl}>Trend</span>
        <span className={`${styles.ihsgVal} ${ctx.ihsg_trend === 'BULLISH' ? styles.up : ctx.ihsg_trend === 'BEARISH' ? styles.down : ''}`}>
          {ctx.ihsg_trend}
        </span>
      </div>
      <div className={styles.ihsgItem}>
        <span className={styles.ihsgLbl}>Above MA50</span>
        <span className={ctx.ihsg_above_ma50 ? styles.up : styles.down}>
          {ctx.ihsg_above_ma50 ? 'Ya' : 'Tidak'}
        </span>
      </div>
    </div>
  )
}

export default function Home({ initialData, loadError }) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(loadError || null)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [activeTab, setActiveTab] = useState('intraday')

  const [intradaySearch, setIntradaySearch] = useState('')
  const [intradaySortKey, setIntradaySortKey] = useState('rank')
  const [intradayFilterTier, setIntradayFilterTier] = useState('')

  const [araSearch, setAraSearch] = useState('')
  const [araFilterPattern, setAraFilterPattern] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/combined')
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date().toLocaleTimeString('id-ID'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialData) fetchData()
    const iv = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(iv)
  }, [fetchData, initialData])

  const intradayStocks = useMemo(() => {
    const raw = data?.logika_lama_intraday ?? []
    let list = [...raw]
    if (intradaySearch) {
      const q = intradaySearch.toLowerCase()
      list = list.filter(s => s.ticker?.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q))
    }
    if (intradayFilterTier) {
      list = list.filter(s => s.scoring?.tier === intradayFilterTier)
    }
    switch (intradaySortKey) {
      case 'score_desc': list.sort((a, b) => (b.scoring?.confidence_score ?? 0) - (a.scoring?.confidence_score ?? 0)); break
      case 'change_desc': list.sort((a, b) => (b.market_data?.change_pct ?? 0) - (a.market_data?.change_pct ?? 0)); break
      case 'value_desc': list.sort((a, b) => (b.market_data?.value_today ?? 0) - (a.market_data?.value_today ?? 0)); break
      case 'rr_desc': {
        const rrNum = s => parseFloat((s.entry_plan?.rr_ratio ?? '0').replace('1:', '')) || 0
        list.sort((a, b) => rrNum(b) - rrNum(a))
        break
      }
      default: list.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    }
    return list
  }, [data, intradaySearch, intradaySortKey, intradayFilterTier])

  const araStocks = useMemo(() => {
    const raw = data?.logika_baru_calon_ara ?? []
    let list = [...raw]
    if (araSearch) {
      const q = araSearch.toLowerCase()
      list = list.filter(s => s.ticker?.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q))
    }
    if (araFilterPattern) {
      list = list.filter(s => s.pattern_type === araFilterPattern)
    }
    return list
  }, [data, araSearch, araFilterPattern])

  const meta = data?.meta || {}
  const ctx = data?.market_context || null
  const summary = data?.screening_summary || null

  return (
    <>
      <Head>
        <title>Screener IDX — {meta.date || 'Dashboard'}</title>
        <meta name="description" content="Stock screener Indonesia: intraday SMC + calon ARA detector" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <div className={styles.logoBox}>IDX</div>
            <div>
              <h1 className={styles.siteTitle}>Screener IDX</h1>
              <p className={styles.siteSub}>Pre-Market Intraday · SMC · Broker Accumulation · ARA Detector</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {lastRefresh && <span className={styles.refreshTime}>Refresh: {lastRefresh}</span>}
            <button className={styles.btn} onClick={fetchData} disabled={loading}>
              {loading ? '⏳' : '↺'} Refresh
            </button>
          </div>
        </header>

        {ctx && <IhsgBanner ctx={ctx} />}

        {ctx?.warning && (
          <div className={styles.alertBanner}>{ctx.warning}</div>
        )}
        {meta.mode_warning && (
          <div className={styles.alertBanner}>{meta.mode_warning}</div>
        )}

        <div className={styles.metaRow}>
          <span className={styles.metaChip}>{meta.mode || '-'}</span>
          <span className={styles.metaChip}>{meta.session_label || '-'}</span>
          <span className={styles.metaChip}>{meta.generated_at || '-'}</span>
          <span className={`${styles.metaChip} ${meta.status === 'success' ? styles.metaSuccess : styles.metaWarn}`}>
            {meta.status || 'unknown'}
          </span>
        </div>

        <SummaryFunnel summary={summary} />

        {loading && !data && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Memuat data screening...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorBox}>
            <p className={styles.errorTitle}>Gagal memuat data</p>
            <p className={styles.errorMsg}>{error}</p>
            <button className={styles.btn} onClick={fetchData}>Coba Lagi</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <TabBar
              active={activeTab}
              onChange={setActiveTab}
              counts={{ intraday: data.logika_lama_intraday?.length ?? 0, ara: data.logika_baru_calon_ara?.length ?? 0 }}
            />

            {activeTab === 'intraday' && (
              <>
                <FilterBar
                  search={intradaySearch}
                  onSearch={setIntradaySearch}
                  sortKey={intradaySortKey}
                  onSort={setIntradaySortKey}
                  filterTier={intradayFilterTier}
                  onFilterTier={setIntradayFilterTier}
                />
                {intradayStocks.length === 0 ? (
                  <div className={styles.stateBox}>
                    <p>Tidak ada saham yang memenuhi filter.</p>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {intradayStocks.map((s, i) => (
                      <IntradayCard key={s.ticker} stock={s} rank={s.rank ?? (i + 1)} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'ara' && (
              <>
                <div className={styles.araDisclaimer}>
                  {data.meta?.ara_disclaimer}
                </div>
                <AraFilterBar
                  search={araSearch}
                  onSearch={setAraSearch}
                  filterPattern={araFilterPattern}
                  onFilterPattern={setAraFilterPattern}
                />
                {araStocks.length === 0 ? (
                  <div className={styles.stateBox}>
                    <p>Tidak ada kandidat ARA yang memenuhi filter.</p>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {araStocks.map((s) => (
                      <AraCard key={s.ticker} stock={s} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <footer className={styles.footer}>
          <p>
            <strong>Disclaimer:</strong> Bukan rekomendasi investasi. Lakukan riset mandiri sebelum trading.
            Risiko ditanggung masing-masing. Data: Stockbit API &amp; Yahoo Finance.
          </p>
        </footer>
      </div>
    </>
  )
}

export async function getStaticProps() {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'combined_screening.json')
    if (!fs.existsSync(filePath)) {
      return { props: { initialData: null, loadError: 'combined_screening.json belum tersedia.' }, revalidate: 60 }
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(raw)
    return {
      props: { initialData: json, loadError: null },
      revalidate: 300,
    }
  } catch (e) {
    return { props: { initialData: null, loadError: String(e.message) }, revalidate: 60 }
  }
}
