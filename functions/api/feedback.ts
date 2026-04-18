// /api/feedback — 用户主动提交真实 MBTI 反馈

interface FeedbackPayload {
  submissionId: string
  selfMbti: string
  confidence: number
  note?: string
  appVersion: string
}

export async function onRequestPost(context: any) {
  const { DB } = context.env as { DB: D1Database }

  let payload: FeedbackPayload
  try {
    payload = await context.request.json() as FeedbackPayload
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { submissionId, selfMbti, confidence, note, appVersion } = payload

  if (!selfMbti || !confidence || !appVersion) {
    return new Response('Missing required fields', { status: 400 })
  }

  const validMbti = /^[EI][SN][TF][JP]$/i
  if (!validMbti.test(selfMbti)) {
    return new Response('Invalid MBTI format', { status: 400 })
  }

  const feedbackId = crypto.randomUUID()
  const now = new Date().toISOString()

  try {
    await DB.prepare(
      `INSERT INTO mbti_feedback (id, submission_id, created_at, app_version, self_mbti, confidence, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      feedbackId,
      submissionId || null,
      now,
      appVersion,
      selfMbti.toUpperCase(),
      Math.max(1, Math.min(5, confidence)),
      note || null
    ).run()

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Feedback error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
