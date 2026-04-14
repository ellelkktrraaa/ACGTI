<script setup lang="ts">
import { computed, onMounted } from 'vue'

import { useQuiz } from '../composables/useQuiz'
import { useI18n } from '../i18n'
import {
  getHiddenCharacterOrder,
  getHiddenCharacterTitle,
  getLocalizedCharacterName,
  getLocalizedCharacterSeries,
  isHiddenCharacter,
} from '../i18n/characters'

const { characters, ensureData } = useQuiz()
const { locale, t } = useI18n()

// 进入图鉴页时才加载角色数据
onMounted(() => {
  void ensureData()
})

const visibleCharacters = computed(() => characters.value.filter((character) => !isHiddenCharacter(character)))
const hiddenCharacters = computed(() => characters.value.filter((character) => isHiddenCharacter(character)))

const orderedCharacters = computed(() => {
  return [
    ...visibleCharacters.value,
    ...[...hiddenCharacters.value].sort((left, right) => getHiddenCharacterOrder(left) - getHiddenCharacterOrder(right)),
  ]
})

const latestCharacters = computed(() => {
  return [...visibleCharacters.value]
    .map((character, index) => ({
      character,
      index,
      timestamp: Date.parse(character.addedAt ?? ''),
    }))
    .sort((left, right) => {
      const leftHasDate = Number.isFinite(left.timestamp)
      const rightHasDate = Number.isFinite(right.timestamp)

      if (leftHasDate && rightHasDate && left.timestamp !== right.timestamp) {
        return right.timestamp - left.timestamp
      }

      if (leftHasDate !== rightHasDate) {
        return leftHasDate ? -1 : 1
      }

      return right.index - left.index
    })
    .slice(0, 3)
    .map(({ character }) => character)
})

const localizedStatsText = computed(() => {
  return t('characters.stats', { count: orderedCharacters.value.length })
})
</script>

<template>
  <div class="page-stack page-stack--narrow">
    <section class="hero-panel center compact">
      <h1 class="display-title">{{ t('characters.title') }}</h1>
      <p class="lead">{{ t('characters.lead') }}</p>
      
      <div class="stats-panel" v-if="orderedCharacters.length > 0">
        <span class="stat-count">{{ localizedStatsText }}</span>
        <span class="stat-divider" v-if="latestCharacters.length > 0">｜</span>
        <span class="stat-latest" v-if="latestCharacters.length > 0">
          {{ t('characters.latest') }}
          <template v-for="(char, index) in latestCharacters" :key="char.id">
            <RouterLink 
              class="latest-link"
              :to="{ path: '/result', query: { character: char.id } }"
            >{{ getLocalizedCharacterName(char, locale) }}</RouterLink><span v-if="index < latestCharacters.length - 1">, </span>
          </template>
        </span>
      </div>
    </section>

    <section class="characters-grid">
      <component
        v-for="character in orderedCharacters"
        :key="character.id"
        :is="isHiddenCharacter(character) ? 'article' : 'RouterLink'"
        :to="isHiddenCharacter(character) ? undefined : { path: '/result', query: { character: character.id } }"
        class="character-card"
        :class="{ 'character-card--hidden': isHiddenCharacter(character) }"
        :style="{ '--accent-color': character.accent }"
        v-reveal
      >
        <div class="card-image-wrap">
          <img
            v-if="!isHiddenCharacter(character)"
            :src="character.thumb || character.image"
            :alt="getLocalizedCharacterName(character, locale)"
            class="card-image"
            loading="lazy"
            decoding="async"
            width="320"
            height="320"
          />
          <div v-else class="card-image-placeholder">{{ getLocalizedCharacterSeries(character, locale) }}</div>
        </div>
        <div class="card-content">
          <div class="card-tags">
            <span class="card-code">{{ character.code }}</span>
            <span class="card-mbti">{{ character.matchCode }}</span>
            <span v-if="character.personaBasis?.type === 'fandom-impression'" class="card-fandom-tag">{{ t('result.personaBasisBadge') }}</span>
          </div>
          <h2 class="card-name">{{ getLocalizedCharacterName(character, locale) }}</h2>
          <p class="card-source">{{ getLocalizedCharacterSeries(character, locale) }}</p>
          <p class="card-title">
            {{ isHiddenCharacter(character) ? getHiddenCharacterTitle(locale, character) : t('characters.' + character.id + '.title', undefined, character.title) }}
          </p>
        </div>
      </component>
    </section>
  </div>
</template>

<style scoped>
.page-stack--narrow {
  gap: 1rem;
}

.stats-panel {
  margin-top: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: var(--surface-color, #ffffff);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.stat-count {
  font-weight: 700;
  color: #333;
}

.stat-divider {
  color: #ddd;
}

.stat-latest {
  color: #666;
}

.latest-link {
  color: var(--primary-color, #42b883);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.latest-link:hover {
  text-decoration: underline;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 0.25rem 1.5rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.character-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;
  border: 2px solid transparent;
}

.character-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--accent-color, #42b883);
}

.character-card--hidden {
  cursor: default;
}

.character-card--hidden:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: transparent;
}

.card-image-wrap {
  width: 100%;
  aspect-ratio: 1;
  background-color: #f8f9fa;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background: linear-gradient(to bottom, #f8f9fa, color-mix(in srgb, var(--accent-color, #e9ecef) 20%, transparent));
}

.card-image {
  width: 90%;
  height: 90%;
  object-fit: contain;
  object-position: bottom;
  transform-origin: bottom center;
  transition: transform 0.3s ease;
}

.card-image-placeholder {
  width: calc(100% - 28px);
  height: calc(100% - 28px);
  margin: 14px;
  border-radius: 8px;
  border: 1px dashed color-mix(in srgb, var(--accent-color, #42b883) 48%, white);
  background: color-mix(in srgb, var(--accent-color, #42b883) 10%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
  color: #50606d;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.character-card:hover .card-image {
  transform: scale(1.05);
}

.character-card--hidden:hover .card-image {
  transform: none;
}

.card-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.card-code {
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--accent-color, #42b883);
  background: color-mix(in srgb, var(--accent-color, #42b883) 15%, transparent);
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
}

.card-mbti {
  font-weight: 700;
  font-size: 0.85rem;
  color: #6c757d;
  background: #e9ecef;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
}

.card-fandom-tag {
  font-weight: 700;
  font-size: 0.75rem;
  color: #8a6d1f;
  background: #fef3cd;
  border: 1px solid #f0e2b0;
  padding: 0.15rem 0.5rem;
  border-radius: 100px;
}

.card-name {
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0 0 0.25rem 0;
  color: #212529;
}

.card-source {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.card-title {
  font-size: 0.9rem;
  color: #495057;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 600px) {
  .characters-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 0.25rem 1rem 1rem;
  }
  
  .card-content {
    padding: 0.75rem;
  }
  
  .card-name {
    font-size: 1.1rem;
  }

  .card-tags {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .card-title {
    font-size: 0.8rem;
  }
}
</style>
