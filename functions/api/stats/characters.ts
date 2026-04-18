// /api/stats/characters — 角色命中榜

export async function onRequestGet(context: any) {
  const { DB } = context.env as { DB: D1Database }

  try {
    const { results } = await DB.prepare(
      `SELECT character_code, COUNT(*) AS cnt
       FROM submissions
       GROUP BY character_code
       ORDER BY cnt DESC
       LIMIT 100`
    ).all<{ character_code: string; cnt: number }>()

    return new Response(JSON.stringify({ characters: results }), {
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
