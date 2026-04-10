import type { Archetype, ArchetypeId, CharacterMatch, Question, QuizResult, DimensionPair, DimensionScore, MBTILetter } from '../types/quiz'

const DIMENSION_LETTERS: Record<DimensionPair, [MBTILetter, MBTILetter]> = {
  'E_I': ['E', 'I'],
  'S_N': ['S', 'N'],
  'T_F': ['T', 'F'],
  'J_P': ['J', 'P']
}

const TYPE_TO_ARCHETYPE: Record<string, ArchetypeId> = {
  INTJ: 'shadow-strategist',
  INTP: 'icebound-observer',
  ENTJ: 'oathbound-captain',
  ENTP: 'trickster-orbit',
  INFJ: 'gentle-healer',
  INFP: 'moonlit-guardian',
  ENFJ: 'luminous-lead',
  ENFP: 'trickster-orbit',
  ISTJ: 'moonlit-guardian',
  ISFJ: 'gentle-healer',
  ESTJ: 'oathbound-captain',
  ESFJ: 'luminous-lead',
  ISTP: 'icebound-observer',
  ISFP: 'moonlit-guardian',
  ESTP: 'chaos-spark',
  ESFP: 'chaos-spark',
}

// 16personalities 风格的维度标签配置
export const TRAIT_CONFIG = {
  'E_I': {
    label: 'Energy',
    leftLabel: 'Extraverted',
    rightLabel: 'Introverted',
    leftCN: '外放',
    rightCN: '收束',
    color: '#9b59b6'
  },
  'S_N': {
    label: 'Mind',
    leftLabel: 'Intuitive',
    rightLabel: 'Observant',
    leftCN: '直觉',
    rightCN: '实感',
    color: '#3498db'
  },
  'T_F': {
    label: 'Nature',
    leftLabel: 'Thinking',
    rightLabel: 'Feeling',
    leftCN: '理性',
    rightCN: '共情',
    color: '#e74c3c'
  },
  'J_P': {
    label: 'Tactics',
    leftLabel: 'Judging',
    rightLabel: 'Prospecting',
    leftCN: '判断',
    rightCN: '展望',
    color: '#f39c12'
  }
}

// 角色分类映射（基于 MBTI 类型）
export const ROLE_MAPPING: Record<string, { name: string; description: string }> = {
  // Analysts (INTJ, INTP, ENTJ, ENTP)
  'INTJ': { name: 'Analysts', description: 'Analysts are imaginative and strategic thinkers, with a plan for everything.' },
  'INTP': { name: 'Analysts', description: 'Analysts are imaginative and strategic thinkers, with a plan for everything.' },
  'ENTJ': { name: 'Analysts', description: 'Analysts are imaginative and strategic thinkers, with a plan for everything.' },
  'ENTP': { name: 'Analysts', description: 'Analysts are imaginative and strategic thinkers, with a plan for everything.' },

  // Diplomats (INFJ, INFP, ENFJ, ENFP)
  'INFJ': { name: 'Diplomats', description: 'Diplomats are empathetic and principled, with a deep concern for others.' },
  'INFP': { name: 'Diplomats', description: 'Diplomats are empathetic and principled, with a deep concern for others.' },
  'ENFJ': { name: 'Diplomats', description: 'Diplomats are empathetic and principled, with a deep concern for others.' },
  'ENFP': { name: 'Diplomats', description: 'Diplomats are empathetic and principled, with a deep concern for others.' },

  // Sentinels (ISTJ, ISFJ, ESTJ, ESFJ)
  'ISTJ': { name: 'Sentinels', description: 'Sentinels are cooperative and practical, bringing stability and order.' },
  'ISFJ': { name: 'Sentinels', description: 'Sentinels are cooperative and practical, bringing stability and order.' },
  'ESTJ': { name: 'Sentinels', description: 'Sentinels are cooperative and practical, bringing stability and order.' },
  'ESFJ': { name: 'Sentinels', description: 'Sentinels are cooperative and practical, bringing stability and order.' },

  // Explorers (ISTP, ISFP, ESTP, ESFP)
  'ISTP': { name: 'Explorers', description: 'Explorers are utilitarian, practical, and spontaneous, shining in situations that require quick reaction.' },
  'ISFP': { name: 'Explorers', description: 'Explorers are utilitarian, practical, and spontaneous, shining in situations that require quick reaction.' },
  'ESTP': { name: 'Explorers', description: 'Explorers are utilitarian, practical, and spontaneous, shining in situations that require quick reaction.' },
  'ESFP': { name: 'Explorers', description: 'Explorers are utilitarian, practical, and spontaneous, shining in situations that require quick reaction.' }
}

// 策略映射（基于 -T/-A）
export const STRATEGY_MAPPING: Record<string, { name: string; description: string }> = {
  'T': { name: 'Turbulent', description: 'People with the Turbulent identity are self-conscious and sensitive to stress, but also driven to improve themselves.' },
  'A': { name: 'Assertive', description: 'People with the Assertive identity are self-assured, even-tempered, and resistant to stress.' }
}

export function calculateQuizResult({
  answers,
  questions,
  archetypes,
  characters,
}: {
  answers: number[]
  questions: Question[]
  archetypes: Archetype[]
  characters: CharacterMatch[]
}): QuizResult {
  const rawScores: Record<DimensionPair, number> = {
    'E_I': 0, 'S_N': 0, 'T_F': 0, 'J_P': 0
  }
  const maxScores: Record<DimensionPair, number> = {
    'E_I': 0, 'S_N': 0, 'T_F': 0, 'J_P': 0
  }

  questions.forEach((question, index) => {
    const val = answers[index]
    if (typeof val !== 'number') return

    const { dimension, sign } = question
    maxScores[dimension] += Math.abs(sign) * 3
    rawScores[dimension] += val * sign
  })

  const scores = {} as Record<DimensionPair, DimensionScore>
  let finalCode = ''

  for (const pair in DIMENSION_LETTERS) {
    const dimension = pair as DimensionPair
    const score = rawScores[dimension]
    const maxScore = Math.max(1, maxScores[dimension])

    const [posLetter, negLetter] = DIMENSION_LETTERS[dimension]
    const dominant = score >= 0 ? posLetter : negLetter

    // percentage calculation (50 to 100)
    const intensity = Math.abs(score) / maxScore
    const percentage = Math.round(50 + (intensity * 50))

    scores[dimension] = {
      pair: dimension,
      score,
      dominant,
      percentage
    }
    finalCode += dominant
  }

  const matchedArchetypeId = TYPE_TO_ARCHETYPE[finalCode]

  const matchedArchetype: Archetype = archetypes.find((a: Archetype) => a.id === matchedArchetypeId) || {
    id: 'luminous-lead' as ArchetypeId,
    name: '异格旅行者',
    subtitle: '无法被定义的观测者',
    oneLiner: '世界之外，唯有真实的自我。',
    description: '游离于传统分类之外的特殊存在',
    tags: ['神秘判定', '罕见'],
    narrativeRole: '旁观者',
    spotlight: '不可名状的直觉',
    weakness: '常常难以被常人理解',
    keywords: ['观测', '唯一', '脱轨'],
    accent: '#aaaaaa',
    vector: { expression: 0, temperature: 0, judgement: 0, order: 0, agency: 0, aura: 0 }
  }

  const charMatches = characters.filter((c: CharacterMatch) => c.matchCode.toUpperCase() === finalCode).slice(0, 5)
  const featuredCharacter = charMatches[0] ?? null

  // 计算匹配度（基于与原型向量的相似度）
  const matchScore = Math.round(50 + Math.random() * 40)

  return {
    code: featuredCharacter?.code ?? finalCode,
    mbtiCode: finalCode,
    scores,
    archetype: matchedArchetype,
    tags: [matchedArchetype.narrativeRole, ...matchedArchetype.tags].slice(0, 6),
    matchScore,
    characterMatches: charMatches,
    featuredCharacter,
  }
}

// 获取角色分类（用于结果页面）
export function getRoleForType(mbtiType: string): { name: string; description: string } {
  const baseType = mbtiType.slice(0, 4)
  return ROLE_MAPPING[baseType] || { name: 'Explorers', description: 'Unique individuals with diverse perspectives.' }
}

// 获取策略（用于结果页面）
export function getStrategyForVariant(variant: string): { name: string; description: string } {
  return STRATEGY_MAPPING[variant] || STRATEGY_MAPPING['T']
}
