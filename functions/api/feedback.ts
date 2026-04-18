// /api/feedback — 用户主动提交真实 MBTI 反馈
// 接入 Turnstile 服务端校验，note 限长且不公开

import {
  str,
  num,
  isValidMbti,
  isValidUuid,
  verifyTurnstile,
  checkRateLimit,
} from './_shared'

export async function onRequestPost(context: any) {
  const { DB } = context.env as { DB: D1Database }

  // --- 限流 ---
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  const allowed = await checkRateLimit(DB, ip, 5)
  if (!allowed) return new Response(null, { status: 429 })

  // --- 解析 payload ---
  let raw: any
  try {
    raw = await context.request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Turnstile 校验（前端需传 turnstileToken 字段）
  const turnstileToken = str(raw.turnstileToken, 2048)
  if (!turnstileToken) {
    return new Response('Missing Turnstile token', { status: 400 })
  }
  const turnstileOk = await verifyTurnstile(turnstileToken, ip, context.env)
  if (!turnstileOk) {
    return new Response('Forbidden', { status: 403 })
  }

  // 白名单提取字段
  const submissionId = str(raw.submissionId, 64)
  const selfMbti = str(raw.selfMbti, 4)
  const confidence = num(raw.confidence, 1, 5)
  const note = typeof raw.note === 'string' ? raw.note.slice(0, 200) : null
  const appVersion = str(raw.appVersion, 16)

  // 必填校验
  if (!selfMbti || confidence === null || !appVersion) {
    return new Response('Missing required fields', { status: 400 })
  }
  if (!isValidMbti(selfMbti)) {
    return new Response('Invalid MBTI format', { status: 400 })
  }
  if (submissionId && !isValidUuid(submissionId)) {
    return new Response('Invalid submissionId', { status: 400 })
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
      confidence,
      note,
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
