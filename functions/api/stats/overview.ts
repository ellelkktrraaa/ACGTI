// /api/stats/overview — 总提交数、今日提交数、24h 提交数

export async function onRequestGet(context: any) {
  const { DB } = context.env as { DB: D1Database }

  try {
    const total = await DB.prepare('SELECT COUNT(*) AS cnt FROM submissions').first<{ cnt: number }>()

    const today = new Date().toISOString().slice(0, 10)
    const todayResult = await DB.prepare(
      'SELECT COUNT(*) AS cnt FROM submissions WHERE created_at >= ?'
    ).bind(today + 'T00:00:00Z').first<{ cnt: number }>()

    const now = Date.now()
    const h24ago = new Date(now - 86400000).toISOString()
    const h24Result = await DB.prepare(
      'SELECT COUNT(*) AS cnt FROM submissions WHERE created_at >= ?'
    ).bind(h24ago).first<{ cnt: number }>()

    return new Response(JSON.stringify({
      totalSubmissions: total?.cnt ?? 0,
      todaySubmissions: todayResult?.cnt ?? 0,
      last24hSubmissions: h24Result?.cnt ?? 0,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (err) {
    console.error('Stats overview error:', err)
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
