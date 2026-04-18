// /api/stats/archetypes — 原型排行榜

export async function onRequestGet(context: any) {
  const { DB } = context.env as { DB: D1Database }

  try {
    const { results } = await DB.prepare(
      `SELECT archetype_code, COUNT(*) AS cnt
       FROM submissions
       GROUP BY archetype_code
       ORDER BY cnt DESC`
    ).all<{ archetype_code: string; cnt: number }>()

    return new Response(JSON.stringify({ archetypes: results }), {
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
