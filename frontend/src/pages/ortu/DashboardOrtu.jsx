import { useEffect, useRef, useState } from 'preact/hooks'
import api from '../../utils/api'
import { AppShell } from '../../components/layout/AppShell.jsx'
import Chart from 'chart.js/auto'

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function DashboardOrtu({ user, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function fetchData() {
      try {
        const res = await api.get('/dashboard')
        if (!mounted) return
        setData(res.data || res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!data || !canvasRef.current) return

    const labels = (data.trend || []).map((r) => r.tanggal || '')
    const hadir = (data.trend || []).map((r) => r.hadir || 0)

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Hadir',
            data: hadir,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6,182,212,0.12)',
            tension: 0.3,
          },
        ],
      },
      options: { maintainAspectRatio: false },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [data])

  const totals = data?.totals || {}

  return (
    <AppShell title={`Dashboard Orang Tua`} navItems={[]}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tepat Waktu" value={totals.tepat_waktu ?? 0} />
        <StatCard label="Terlambat" value={totals.terlambat ?? 0} />
        <StatCard label="Izin" value={totals.izin ?? 0} />
      </div>

      <section style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '.5rem' }}>Trend 7 Hari</h3>
        <div style={{ height: 320 }}>
          <canvas ref={canvasRef} />
        </div>
      </section>
    </AppShell>
  )
}
