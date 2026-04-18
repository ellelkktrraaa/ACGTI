// /api/submit — 记录一次问卷提交（总记录 + 答题明细）
// 纯落盘接口，快速返回 204，不阻塞用户

interface SubmitPayload {
  submissionId: string
  appVersion: string
  archetypeCode: string
  characterCode: string
  dimensionScores: {
    ei?: number
    sn?: number
    tf?: number
    jp?: number
  }
  answers?: Array<{ questionId: string; answerValue: number }>
  durationMs?: number
}

export async function onRequestPost(context: any) {
  const { DB } = context.env as { DB: D1Database }

  let payload: SubmitPayload
  try {
    payload = await context.request.json() as SubmitPayload
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const {
    submissionId,
    appVersion,
    archetypeCode,
    characterCode,
    dimensionScores,
    answers,
    durationMs,
  } = payload

  if (!submissionId || !appVersion || !archetypeCode || !characterCode) {
    return new Response('Missing required fields', { status: 400 })
  }

  const now = new Date().toISOString()

  try {
    await DB.prepare(
      `INSERT OR IGNORE INTO submissions (id, created_at, app_version, archetype_code, character_code, ei_score, sn_score, tf_score, jp_score, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      submissionId,
      now,
      appVersion,
      archetypeCode,
      characterCode,
      dimensionScores?.ei ?? null,
      dimensionScores?.sn ?? null,
      dimensionScores?.tf ?? null,
      dimensionScores?.jp ?? null,
      durationMs ?? null
    ).run()

    if (Array.isArray(answers) && answers.length > 0) {
      const stmt = DB.prepare(
        `INSERT OR IGNORE INTO submission_answers (submission_id, question_id, answer_value)
         VALUES (?, ?, ?)`
      )
      const batch = answers.map((a) =>
        stmt.bind(submissionId, a.questionId, a.answerValue)
      )
      await DB.batch(batch)
    }

    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('Submit error:', err)
    return new Response(null, { status: 204 })
  }
}
