<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Informations</h1>

    <button
      v-if="hasAccess"
      @click="showCreate = true"
      class="mb-4 bg-green-500 text-white px-4 py-2 rounded"
    >
      + Créer une page
    </button>

    <div v-if="showCreate" class="mb-4 border p-4 rounded bg-white shadow">
      <h2 class="font-semibold mb-4">Nouvelle page</h2>

      <div class="mb-2">
        <label class="block text-gray-700">Titre</label>
        <input
          v-model="newPage.title"
          placeholder="Titre de la page"
          class="border p-2 w-full"
        />
      </div>

      <div class="mb-2">
        <label class="block text-gray-700">Image</label>
        <input type="file" @change="onFileChange" accept="image/*" />
      </div>

      <div class="mb-4">
        <label class="block text-gray-700">Vidéo (URL YouTube)</label>
        <input
          v-model="videoUrlInput"
          placeholder="https://www.youtube.com/watch?v=..."
          class="border p-2 w-full"
        />
      </div>

      <div class="mb-4">
        <label class="block text-gray-700">Contenu</label>
        <textarea
          v-model="newPage.content"
          placeholder="Contenu"
          class="border p-2 w-full"
          rows="6"
        ></textarea>
      </div>

      <button
        @click="createPage()"
        :disabled="!newPage.title.trim() || !newPage.content.trim()"
        class="bg-blue-600 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
      >
        Enregistrer
      </button>
      <button
        @click="showCreate = false"
        class="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Annuler
      </button>
    </div>

    <ul>
      <li
        v-for="page in pages"
        :key="page.id"
        class="border-b py-2 flex justify-between items-center"
      >
        <router-link :to="{ name: 'info-detail', params: { slug: page.slug } }">
          {{ page.title }}
        </router-link>
      </li>
    </ul>

    <div class="mt-4 flex justify-between">
      <button @click="prevPage" :disabled="page === 1">Précédent</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="page === totalPages">
        Suivant
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

interface InfoPage {
  id: string
  slug: string
  title: string
  content: string
  imageUrl?: string
  videoUrl?: string
}

const pages = ref<InfoPage[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)

const showCreate = ref(false)
const newPage = ref({ title: '', content: '' })
const videoUrlInput = ref('')
const selectedFile = ref<File | null>(null)

const slug = computed(() =>
  newPage.value.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
)

const currentUser = ref<{ role: string } | null>(null)
const hasAccess = computed(() =>
  currentUser.value?.role === 'admin' || currentUser.value?.role === 'superAdmin'
)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function loadPages() {
  const res = await api.get<{ items: InfoPage[]; total: number }>(
    '/info',
    { params: { page: page.value, limit: limit.value } }
  )
  pages.value = res.data.items
  total.value = res.data.total
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadPages()
  }
}
function nextPage() {
  if (page.value * limit.value < total.value) {
    page.value++
    loadPages()
  }
}

const totalPages = computed(() => Math.ceil(total.value / limit.value))

async function createPage() {
  const formData = new FormData()
  formData.append('slug', slug.value)
  formData.append('title', newPage.value.title)
  formData.append('content', newPage.value.content)
  if (selectedFile.value) formData.append('image', selectedFile.value)
  if (videoUrlInput.value.trim()) formData.append('videoUrl', videoUrlInput.value.trim())

  await api.post('/info/admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  showCreate.value = false
  newPage.value = { title: '', content: '' }
  videoUrlInput.value = ''
  selectedFile.value = null
  loadPages()
}

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) currentUser.value = JSON.parse(stored)
  loadPages()
})
</script>
