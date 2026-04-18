// /api/stats/archetypes — 从快照表读取原型排行榜
// 快照表由 Cron Worker 每 5 分钟更新一次

export async function onRequestGet(context: any) {
  const { DB } = context.env as { DB: D1Database }

  try {
    const snapshot = await DB.prepare(
      'SELECT value_json, updated_at FROM stats_snapshot WHERE key = ?'
    ).bind('archetypes').first<{ value_json: string; updated_at: string }>()

    if (!snapshot) {
      // 快照表尚未初始化
      return new Response(JSON.stringify({ archetypes: [] }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120',
        },
      })
    }

    const data = JSON.parse(snapshot.value_json)
    return new Response(JSON.stringify({ archetypes: data }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
      },
    })
  } catch (err) {
    console.error('Stats archetypes error:', err)
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
