<template>
  <div class="max-w-3xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Auto-diagnostic de stress (Holmes & Rahe)</h1>

    <!-- Section de configuration pour les administrateurs -->
    <div v-if="showConfigSection" class="mb-6 p-4 border rounded bg-gray-50">
      <button @click="showConfigSection = false" class="mb-4 px-4 py-2 bg-gray-200 rounded">
        Masquer la configuration
      </button>
      <!-- Configuration des questions -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2">Questions</h2>
        <div v-for="(q, index) in questions" :key="q.id || index" class="flex items-center mb-2">
          <input v-model="q.label" placeholder="Texte de la question" class="border p-1 flex-1 mr-2" />
          <input v-model.number="q.points" type="number" placeholder="Points" class="w-20 border p-1" />
          <button @click="removeQuestion(index)" class="ml-2 text-red-500">Supprimer</button>
        </div>
        <button @click="addQuestion" class="mt-2 px-3 py-1 bg-green-500 text-white rounded">Ajouter une question</button>
        <button @click="saveQuestions" class="mt-2 ml-2 px-3 py-1 bg-blue-500 text-white rounded">Enregistrer questions</button>
      </div>

      <!-- Configuration des résultats -->
      <div>
        <h2 class="text-xl font-semibold mb-2">Résultats</h2>
        <div v-for="(r, index) in results" :key="r.id || index" class="mb-4 border p-2 rounded">
          <div class="flex items-center mb-1">
            <label class="w-16">Titre</label>
            <input v-model="r.title" type="text" placeholder="Titre" class="border p-1 flex-1 mr-2" />
          </div>
          <div class="flex items-center mb-1">
            <label class="w-16">Min</label>
            <input v-model.number="r.minScore" type="number" class="border p-1 flex-1 mr-2" />
            <label class="w-16">Max</label>
            <input v-model.number="r.maxScore" type="number" class="border p-1 flex-1 mr-2" />
            <button @click="removeResult(index)" class="text-red-500">Supprimer</button>
          </div>
          <textarea v-model="r.message" placeholder="Description du résultat" class="w-full border p-1" rows="2"></textarea>
        </div>
        <button @click="addResult" class="mt-2 px-3 py-1 bg-green-500 text-white rounded">Ajouter un résultat</button>
        <button @click="saveResults" class="mt-2 ml-2 px-3 py-1 bg-blue-500 text-white rounded">Enregistrer résultats</button>
      </div>
    </div>

    <!-- Bouton pour ouvrir la configuration (admins) -->
    <div class="mb-4" v-if="isAdmin && !showConfigSection">
      <button @click="showConfigSection = true" class="px-4 py-2 bg-blue-500 text-white rounded">Configurer le diagnostic</button>
    </div>

    <!-- Formulaire / Résultat -->
    <div>
      <h2 class="text-xl font-semibold mb-2">Questionnaire</h2>

      <!-- Affichage du résultat si existant -->
      <div v-if="evaluation">
        <div class="mt-6 p-4 border rounded bg-gray-100">
          <h3 class="text-lg font-semibold mb-1">{{ evaluation.title }}</h3>
          <p class="font-medium mb-2">Score : {{ scoreFromServer }}</p>
          <p>{{ evaluation.message }}</p>
        </div>
        <button v-if="currentUser" @click="resetTest" class="mt-4 px-3 py-1 bg-yellow-500 text-white rounded">
          Repasser le test
        </button>
      </div>

      <!-- Questionnaire si pas de résultat en mémoire -->
      <div v-else>
        <!-- Phase de questions individuelles -->
        <div v-if="!isComplete">
          <p class="mb-4">Ne tenez compte que des événements qui se sont produits au cours des 24 derniers mois.</p>
          <p class="mb-4">Question {{ currentIndex + 1 }} sur {{ sortedQuestions.length }} :</p>
          <p class="mb-4 font-medium">{{ currentQuestion.label }}</p>
          <div class="flex space-x-4">
            <button @click="answer(true)" class="px-4 py-2 bg-green-500 text-white rounded">Oui</button>
            <button @click="answer(false)" class="px-4 py-2 bg-red-500 text-white rounded">Non</button>
          </div>
        </div>
        <!-- Phase finale, bouton pour afficher résultats -->
        <div v-else class="mt-4">
          <p class="mb-4">Vous avez répondu à toutes les questions !</p>
          <button @click="evaluate" class="px-4 py-2 bg-blue-500 text-white rounded">Afficher le résultat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'

interface DiagnosticQuestion { id: string; label: string; points: number }
interface DiagnosticResult   { id: string; title: string; minScore: number; maxScore: number; message: string }

// Données et state
const questions       = ref<DiagnosticQuestion[]>([])
const results         = ref<DiagnosticResult[]>([])
const selected        = reactive<Record<string, boolean>>({})
const currentIndex    = ref(0)
const evaluation      = ref<DiagnosticResult | null>(null)
const scoreFromServer = ref(0)
const showConfigSection = ref(false)
const error             = ref<string>('')

// Utilisateur
const userJson    = localStorage.getItem('user')
const currentUser = userJson ? JSON.parse(userJson) : null
const isAdmin     = computed(() => currentUser?.role === 'admin' || currentUser?.role === 'superAdmin')

// Computed
const sortedQuestions = computed(() => [...questions.value].sort((a, b) => a.points - b.points))
const currentQuestion = computed(() => sortedQuestions.value[currentIndex.value])
const isComplete      = computed(() => currentIndex.value >= sortedQuestions.value.length)

// Initialisation : charge config et résultat en mémoire (localStorage ou base)
async function fetchData() {
  try {
    const [qRes, rRes] = await Promise.all([
      api.get<DiagnosticQuestion[]>('/diagnostic/questions'),
      api.get<DiagnosticResult[]>('/diagnostic/results-config'),
    ])
    questions.value = qRes.data
    results.value   = rRes.data

    // reset local state
    sortedQuestions.value.forEach(q => (selected[q.id] = false))
    currentIndex.value = 0
    evaluation.value   = null
    scoreFromServer.value = 0

    // 1) si connecté, tenter de charger depuis backend
    if (currentUser) {
      try {
        const resp = await api.get('/diagnostic/user-result')
        scoreFromServer.value = resp.data.score
        evaluation.value      = resp.data.result
        currentIndex.value    = sortedQuestions.value.length
        return
      } catch (err: any) {
        if (err.response?.status !== 404) error.value = 'Erreur chargement résultat utilisateur'
      }
    }

    // 2) sinon, tenter de charger le résultat anonyme en localStorage
    const anon = localStorage.getItem('diagnosticAnon')
    if (anon) {
      try {
        const { score, result } = JSON.parse(anon)
        scoreFromServer.value = score
        evaluation.value      = result
        currentIndex.value    = sortedQuestions.value.length
      } catch {
        localStorage.removeItem('diagnosticAnon')
      }
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur de chargement.'
  }
}

// Répondre à une question
function answer(value: boolean) {
  selected[currentQuestion.value.id] = value
  currentIndex.value++
}

// Évaluation (avec ou sans persistance selon auth)
async function evaluate() {
  try {
    const s = sortedQuestions.value.reduce((sum, q) => sum + (selected[q.id] ? q.points : 0), 0)
    const resp = await api.get('/diagnostic/evaluate', { params: { score: s } })
    scoreFromServer.value = resp.data.score
    evaluation.value      = resp.data.result

    // stocker localement pour utilisateur anonyme
    if (!currentUser) {
      localStorage.setItem('diagnosticAnon', JSON.stringify({ score: scoreFromServer.value, result: evaluation.value }))
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || "Erreur lors de l'évaluation."
  }
}

// Réinitialiser pour repasser le test (backend et local)
async function resetTest() {
  try {
    if (currentUser) {
      await api.delete('/diagnostic/user-result')
    }
    // toujours supprimer le cache anonyme
    localStorage.removeItem('diagnosticAnon')

    // reset UI
    sortedQuestions.value.forEach(q => (selected[q.id] = false))
    currentIndex.value = 0
    evaluation.value   = null
    scoreFromServer.value = 0
  } catch {
    error.value = 'Impossible de réinitialiser le test.'
  }
}

// Fonctions d'administration
function addQuestion() { questions.value.push({ id: '', label: '', points: 0 }) }
function removeQuestion(i: number) { questions.value.splice(i, 1) }
async function saveQuestions() {
  try {
    await api.put('/diagnostic/admin/questions', { questions: questions.value.map(q => ({ id: q.id || undefined, label: q.label, points: q.points })) })
    await fetchData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur sauvegarde questions.'
  }
}
function addResult() { results.value.push({ id: '', title: '', minScore: 0, maxScore: 0, message: '' }) }
function removeResult(i: number) { results.value.splice(i, 1) }
async function saveResults() {
  try {
    await api.put('/diagnostic/admin/results', { results: results.value.map(r => ({ id: r.id || undefined, title: r.title, minScore: r.minScore, maxScore: r.maxScore, message: r.message })) })
    await fetchData()
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur sauvegarde résultats.'
  }
}

onMounted(fetchData)
</script>