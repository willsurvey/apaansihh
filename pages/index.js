// pages/index.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/screening')
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date().toLocaleTimeString('id-ID'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto refresh setiap 10 menit
    const interval = setInterval(fetchData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatRupiah = (val) => {
    if (!val) return '-'
    if (val >= 1_000_000_000) return `Rp${(val / 1_000_000_000).toFixed(1)}M`
    if (val >= 1_000_000) return `Rp${(val / 1_000_000).toFixed(0)}Jt`
    return `Rp${val.toLocaleString('id-ID')}`
  }

  const getTierColor = (tier) => {
    if (tier === 'HIGH') return '#00d4aa'
    if (tier === 'MODERATE') return '#f5a623'
    return '#e74c3c'
  }

  const getDirectionIcon = (dir) => {
    if (dir === 'GAP_UP') return '⬆️'
    if (dir === 'MOMENTUM') return '➡️'
    return '⬇️'
  }

  return (
    <>
      <Head>
        <title>Screener IDX — Saham Pilihan Hari Ini</title>
        <meta name="description" content="Stock screener Indonesia — sinyal intraday harian berbasis SMC, Broker Accumulation, dan Foreign Flow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        {/* HEADER */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.logo}>📊</span>
            <div>
              <h1 className={styles.title}>Screener IDX</h1>
              <p className={styles.subtitle}>Pre-Market Intraday · Limit Order · SMC Strategy</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            {lastRefresh && <span className={styles.refreshTime}>Update: {lastRefresh}</span>}
            <button className={styles.refreshBtn} onClick={fetchData} disabled={loading}>
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </header>

        {/* MARKET CONTEXT */}
        {data?.market_context && (
          <div className={styles.marketBanner}>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>IHSG</span>
              <span className={styles.marketValue}>
                {data.market_context.ihsg_close?.toLocaleString('id-ID') || '-'}
              </span>
            </div>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>Perubahan</span>
              <span
                className={styles.marketValue}
                style={{ color: data.market_context.ihsg_change_pct >= 0 ? '#00d4aa' : '#e74c3c' }}
              >
                {data.market_context.ihsg_change_pct >= 0 ? '+' : ''}
                {data.market_context.ihsg_change_pct?.toFixed(2)}%
              </span>
            </div>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>Trend</span>
              <span
                className={styles.marketValue}
                style={{
                  color:
                    data.market_context.ihsg_trend === 'BULLISH'
                      ? '#00d4aa'
                      : data.market_context.ihsg_trend === 'BEARISH'
                      ? '#e74c3c'
                      : '#f5a623',
                }}
              >
                {data.market_context.ihsg_trend}
              </span>
            </div>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>Mode</span>
              <span className={styles.marketValue}>{data.mode}</span>
            </div>
            <div className={styles.marketItem}>
              <span className={styles.marketLabel}>Generated</span>
              <span className={styles.marketValueSm}>{data.generated_at}</span>
            </div>
          </div>
        )}

        {/* WARNING */}
        {data?.market_context?.warning && (
          <div className={styles.warningBanner}>⚠️ {data.market_context.warning}</div>
        )}
        {data?.mode_warning && (
          <div className={styles.warningBanner}>{data.mode_warning}</div>
        )}

        {/* LOADING */}
        {loading && !data && (
          <div className={styles.center}>
            <div className={styles.spinner} />
            <p>Mengambil data screening...</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className={styles.errorBox}>
            <h3>❌ Gagal memuat data</h3>
            <p>{error}</p>
            <button className={styles.refreshBtn} onClick={fetchData}>Coba Lagi</button>
          </div>
        )}

        {/* NO SIGNAL */}
        {!loading && !error && data?.status === 'no_signal' && (
          <div className={styles.noSignal}>
            <span className={styles.noSignalIcon}>🔍</span>
            <h2>Tidak Ada Sinyal Hari Ini</h2>
            <p>Market tidak memenuhi kriteria screening, atau tidak ada saham yang lolos semua filter.</p>
          </div>
        )}

        {/* SCREENING SUMMARY */}
        {data?.screening_summary && data.status === 'success' && (
          <div className={styles.summaryBar}>
            {Object.entries({
              Universe: data.screening_summary.universe,
              Likuiditas: data.screening_summary.after_liquidity,
              Akumulasi: data.screening_summary.after_accumulation,
              Trend: data.screening_summary.after_trend,
              SMC: data.screening_summary.after_smc,
              'Entry Plan': data.screening_summary.after_entry,
              Final: data.screening_summary.final,
            }).map(([label, val]) => (
              <div key={label} className={styles.summaryItem}>
                <span className={styles.summaryVal}>{val ?? '-'}</span>
                <span className={styles.summaryLabel}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* STOCK CARDS */}
        {!loading && !error && data?.data?.length > 0 && (
          <div className={styles.cardsGrid}>
            {data.data.map((stock) => (
              <div key={stock.ticker} className={styles.card}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <span className={styles.rank}>#{stock.rank}</span>
                    <div>
                      <span className={styles.ticker}>{stock.ticker}</span>
                      <span className={styles.company}>{stock.company}</span>
                    </div>
                  </div>
                  <div className={styles.scoreBox}>
                    <span
                      className={styles.scoreBadge}
                      style={{ background: getTierColor(stock.scoring.tier) }}
                    >
                      {stock.scoring.confidence_score}
                    </span>
                    <span className={styles.tier}>{stock.scoring.tier}</span>
                  </div>
                </div>

                {/* Market Data */}
                <div className={styles.section}>
                  <div className={styles.grid3}>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Close</span>
                      <span className={styles.dataVal}>
                        Rp{stock.market_data.close?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Change</span>
                      <span
                        className={styles.dataVal}
                        style={{ color: stock.market_data.change_pct >= 0 ? '#00d4aa' : '#e74c3c' }}
                      >
                        {stock.market_data.change_pct >= 0 ? '+' : ''}
                        {stock.market_data.change_pct?.toFixed(2)}%
                      </span>
                    </div>
                    <div className={styles.dataItem}>
                      <span className={styles.dataLabel}>Nilai</span>
                      <span className={styles.dataVal}>
                        {formatRupiah(stock.market_data.value_today)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Entry Plan */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    {getDirectionIcon(stock.entry_plan.entry_direction)}{' '}
                    {stock.entry_plan.entry_direction_label || 'Entry Plan'}
                  </div>
                  <div className={styles.entryGrid}>
                    <div className={styles.entryItem}>
                      <span className={styles.entryLabel}>
                        Entry 1 ({stock.entry_plan.entry_1_pct}%)
                      </span>
                      <span className={styles.entryVal}>
                        Rp{stock.entry_plan.entry_1?.toLocaleString('id-ID')}
                      </span>
                      <span className={styles.entryNote}>{stock.entry_plan.entry_1_note}</span>
                    </div>
                    <div className={styles.entryItem}>
                      <span className={styles.entryLabel}>
                        Entry 2 ({stock.entry_plan.entry_2_pct}%)
                      </span>
                      <span className={styles.entryVal}>
                        Rp{stock.entry_plan.entry_2?.toLocaleString('id-ID')}
                      </span>
                      <span className={styles.entryNote}>{stock.entry_plan.entry_2_note}</span>
                    </div>
                    <div className={styles.entryItem}>
                      <span className={styles.entryLabel}>
                        Entry 3 ({stock.entry_plan.entry_3_pct}%)
                      </span>
                      <span className={styles.entryVal}>
                        Rp{stock.entry_plan.entry_3?.toLocaleString('id-ID')}
                      </span>
                      <span className={styles.entryNote}>{stock.entry_plan.entry_3_note}</span>
                    </div>
                  </div>

                  <div className={styles.avgEntry}>
                    Rata-rata Entry:{' '}
                    <strong>Rp{stock.entry_plan.average_entry?.toLocaleString('id-ID')}</strong>
                  </div>
                </div>

                {/* SL / TP */}
                <div className={styles.section}>
                  <div className={styles.slTpGrid}>
                    <div className={styles.slBox}>
                      <span className={styles.slLabel}>⛔ Stop Loss</span>
                      <span className={styles.slVal}>
                        Rp{stock.entry_plan.sl?.toLocaleString('id-ID')}
                      </span>
                      <span className={styles.slPct}>-{stock.entry_plan.sl_pct_risk}%</span>
                    </div>
                    <div className={styles.tpBox}>
                      <span className={styles.tpLabel}>🎯 TP1</span>
                      <span className={styles.tpVal}>
                        Rp{stock.entry_plan.tp1?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={styles.tpBox}>
                      <span className={styles.tpLabel}>🎯 TP2</span>
                      <span className={styles.tpVal}>
                        Rp{stock.entry_plan.tp2?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={styles.tpBox}>
                      <span className={styles.tpLabel}>🎯 TP3</span>
                      <span className={styles.tpVal}>
                        Rp{stock.entry_plan.tp3?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className={styles.rrBadge}>
                    Risk:Reward = <strong>{stock.entry_plan.rr_ratio}</strong>
                  </div>
                </div>

                {/* Accumulation & SMC */}
                <div className={styles.section}>
                  <div className={styles.grid2}>
                    <div>
                      <span className={styles.dataLabel}>Broker Signal</span>
                      <span
                        className={styles.brokerBadge}
                        style={{
                          background:
                            stock.accumulation.broker_signal === 'Big Acc'
                              ? '#00d4aa22'
                              : stock.accumulation.broker_signal === 'Acc'
                              ? '#00d4aa11'
                              : '#ffffff11',
                          borderColor:
                            stock.accumulation.broker_signal === 'Big Acc'
                              ? '#00d4aa'
                              : stock.accumulation.broker_signal === 'Acc'
                              ? '#00d4aa88'
                              : '#ffffff33',
                        }}
                      >
                        {stock.accumulation.broker_signal}
                      </span>
                    </div>
                    <div>
                      <span className={styles.dataLabel}>SMC Structure</span>
                      <span className={styles.smcBadge}>
                        {stock.smc.internal_structure}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signals */}
                {stock.signals?.length > 0 && (
                  <div className={styles.signalsList}>
                    {stock.signals.map((sig, i) => (
                      <div key={i} className={styles.signalItem}>
                        {sig}
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {stock.warnings?.length > 0 && (
                  <div className={styles.warningsList}>
                    {stock.warnings.map((w, i) => (
                      <div key={i} className={styles.warningItem}>
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className={styles.cardFooter}>
                  <span>MA50: Rp{stock.trend?.ma50?.toLocaleString('id-ID')}</span>
                  <span>{stock.trend?.gap_from_ma50_pct?.toFixed(1)}% di atas MA50</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className={styles.footer}>
          <p>
            ⚠️ <strong>Disclaimer:</strong> Informasi ini bukan rekomendasi investasi. Lakukan riset
            sendiri sebelum mengambil keputusan trading. Risiko ditanggung masing-masing.
          </p>
          <p style={{ marginTop: '8px', opacity: 0.5, fontSize: '12px' }}>
            Stock Screener IDX · Data dari Stockbit API & Yahoo Finance
          </p>
        </footer>
      </div>
    </>
  )
}
