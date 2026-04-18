// /api/stats/overview — 从快照表读取总提交数、今日提交数、24h 提交数
// 快照表由 Cron Worker 每 5 分钟更新一次

export async function onRequestGet(context: any) {
  const { DB } = context.env as { DB: D1Database }

  try {
    const snapshot = await DB.prepare(
      'SELECT value_json, updated_at FROM stats_snapshot WHERE key = ?'
    ).bind('overview').first<{ value_json: string; updated_at: string }>()

    if (!snapshot) {
      // 快照表尚未初始化，返回零值
      return new Response(JSON.stringify({
        totalSubmissions: 0,
        todaySubmissions: 0,
        last24hSubmissions: 0,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      })
    }

    const data = JSON.parse(snapshot.value_json)
    return new Response(JSON.stringify(data), {
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
