// /api/stats/characters — 从快照表读取角色命中榜
// 快照表由 Cron Worker 每 15 分钟更新一次

export async function onRequestGet(context: any) {
  const { DB } = context.env as { DB: D1Database }

  try {
    const snapshot = await DB.prepare(
      'SELECT value_json, updated_at FROM stats_snapshot WHERE key = ?'
    ).bind('characters').first<{ value_json: string; updated_at: string }>()

    if (!snapshot) {
      return new Response(JSON.stringify({
        data: { items: [] },
        updatedAt: null,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120',
        },
      })
    }

    const data = JSON.parse(snapshot.value_json)
    return new Response(JSON.stringify({
      data,
      updatedAt: snapshot.updated_at,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120',
      },
    })
  } catch (err) {
    console.error('Stats characters error:', err)
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
