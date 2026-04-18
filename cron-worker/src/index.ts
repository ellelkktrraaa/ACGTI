/**
 * ACGTI Cron Worker
 * 定时任务：每 5 分钟重新计算排行榜统计，更新快照表
 * 
 * 目的：
 * - 避免每次请求都对大表做 GROUP BY 聚合
 * - 让 /api/stats/* 只读预计算的快照，降低 D1 压力
 */

interface Env {
  DB: D1Database
}

// 排行榜数据快照
interface StatsSnapshot {
  overview: {
    totalSubmissions: number
    todaySubmissions: number
    last24hSubmissions: number
  }
  archetypes: Array<{ archetype_code: string; cnt: number }>
  characters: Array<{ character_code: string; cnt: number }>
}

/**
 * 定时触发：计算并更新所有排行榜快照
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`[CRON] Starting stats snapshot calculation at ${new Date().toISOString()}`)

    try {
      // 1. 计算总体统计
      const overview = await calculateOverview(env.DB)
      await updateSnapshot(env.DB, 'overview', overview)

      // 2. 计算原型排行榜
      const archetypes = await calculateArchetypeStats(env.DB)
      await updateSnapshot(env.DB, 'archetypes', archetypes)

      // 3. 计算角色排行榜（top 100）
      const characters = await calculateCharacterStats(env.DB)
      await updateSnapshot(env.DB, 'characters', characters)

      console.log(`[CRON] Successfully updated all snapshots`)
    } catch (error) {
      console.error(`[CRON] Error calculating stats:`, error)
      // 不抛出，让任务记录但不失败（避免影响下一个周期）
    }
  },

  // 支持手动测试触发
  async fetch(request: Request, env: Env) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/trigger') {
      try {
        const overview = await calculateOverview(env.DB)
        await updateSnapshot(env.DB, 'overview', overview)

        const archetypes = await calculateArchetypeStats(env.DB)
        await updateSnapshot(env.DB, 'archetypes', archetypes)

        const characters = await calculateCharacterStats(env.DB)
        await updateSnapshot(env.DB, 'characters', characters)

        return new Response(JSON.stringify({ success: true, message: 'Snapshots updated manually' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('Cron Worker is running', { status: 200 })
  },
}

/**
 * 计算总体统计：总提交数、今日提交数、24h 提交数
 */
async function calculateOverview(db: D1Database) {
  const today = new Date().toISOString().slice(0, 10)
  const h24ago = new Date(Date.now() - 86400000).toISOString()

  const [totalResult, todayResult, h24Result] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS cnt FROM submissions').first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) AS cnt FROM submissions WHERE created_at >= ?').bind(today + 'T00:00:00Z').first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) AS cnt FROM submissions WHERE created_at >= ?').bind(h24ago).first<{ cnt: number }>(),
  ])

  return {
    totalSubmissions: totalResult?.cnt ?? 0,
    todaySubmissions: todayResult?.cnt ?? 0,
    last24hSubmissions: h24Result?.cnt ?? 0,
  }
}

/**
 * 计算原型排行榜
 */
async function calculateArchetypeStats(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT archetype_code, COUNT(*) AS cnt
       FROM submissions
       GROUP BY archetype_code
       ORDER BY cnt DESC`
    )
    .all<{ archetype_code: string; cnt: number }>()

  return result.results ?? []
}

/**
 * 计算角色排行榜（top 100）
 */
async function calculateCharacterStats(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT character_code, COUNT(*) AS cnt
       FROM submissions
       GROUP BY character_code
       ORDER BY cnt DESC
       LIMIT 100`
    )
    .all<{ character_code: string; cnt: number }>()

  return result.results ?? []
}

/**
 * 将结果写入快照表
 */
async function updateSnapshot(db: D1Database, key: string, data: any) {
  const valueJson = JSON.stringify(data)
  const updatedAt = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO stats_snapshot (key, value_json, updated_at) 
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET 
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`
    )
    .bind(key, valueJson, updatedAt)
    .run()

  console.log(`[CRON] Updated snapshot: ${key}`)
}
