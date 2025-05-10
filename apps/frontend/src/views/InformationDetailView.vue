<template>
  <div class="max-w-3xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">{{ info?.title }}</h1>

    <!-- Image en tête -->
    <img
        v-if="info?.imageUrl"
        :src="fullImageUrl"
        alt="Illustration"
        class="mb-6 w-full rounded shadow"
    />

    <!-- Contenu riche -->
    <div class="prose mb-6" v-html="info?.content"></div>

    <!-- Vidéo en pied -->
    <div v-if="info?.videoUrl" class="mt-6">
      <iframe
        :src="embedUrl"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="w-full h-64 rounded"
      ></iframe>
    </div>

    <!-- Bouton Éditer pour admin -->
    <button
      v-if="hasAccess"
      @click="startEdit()"
      class="mt-6 bg-yellow-500 text-white px-4 py-2 rounded"
    >
      ✏️ Éditer
    </button>

    <!-- Formulaire d'édition -->
    <div v-if="editing" class="mt-4 border p-4 rounded bg-white shadow">
      <h2 class="font-semibold mb-4">Modifier la page</h2>

      <div class="mb-2">
        <label class="block text-gray-700">Titre</label>
        <input v-model="form.title" class="border p-2 w-full" />
      </div>

      <div class="mb-2">
        <label class="block text-gray-700">Image (remplace si fichier choisi)</label>
        <input type="file" @change="onEditFileChange" accept="image/*" />
      </div>

      <div class="mb-2">
        <label class="block text-gray-700">Vidéo (URL YouTube)</label>
        <input v-model="form.videoUrl" class="border p-2 w-full" />
      </div>

      <div class="mb-4">
        <label class="block text-gray-700">Contenu</label>
        <textarea v-model="form.content" class="border p-2 w-full" rows="6"></textarea>
      </div>

      <button
        @click="save()"
        class="bg-green-600 text-white px-4 py-2 rounded mr-2"
      >
        Enregistrer
      </button>
      <button
        @click="cancel()"
        class="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Annuler
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

interface InfoPage {
  id: string
  slug: string
  title: string
  content: string
  imageUrl?: string
  videoUrl?: string
}

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string

const info = ref<InfoPage | null>(null)
const editing = ref(false)
const form = ref({
  title: '',
  content: '',
  videoUrl: '',
})
const editFile = ref<File | null>(null)

const currentUser = ref<{ role: string } | null>(null)
const hasAccess = ref(false)

const fullImageUrl = computed(() => {
  if (!info.value?.imageUrl) return '';
  // api.defaults.baseURL vaut 'http://localhost:3000'
  return `${api.defaults.baseURL}${info.value.imageUrl}`;
});

// Générer l'URL embarquée YouTube
const embedUrl = computed(() => {
  if (!info.value?.videoUrl) return ''
  const url = info.value.videoUrl
  const m = url.match(/(?:youtu\.be\/|v=)([^&]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : ''
})

function startEdit() {
  if (!info.value) return
  form.value.title = info.value.title
  form.value.content = info.value.content
  form.value.videoUrl = info.value.videoUrl || ''
  editing.value = true
}

function onEditFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  editFile.value = input.files?.[0] ?? null
}

async function save() {
  if (!info.value) return
  const fd = new FormData()
  fd.append('title', form.value.title)
  fd.append('content', form.value.content)
  fd.append('videoUrl', form.value.videoUrl)
  if (editFile.value) fd.append('image', editFile.value)

  await api.put(`/info/admin/${info.value.id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  editing.value = false
  load()
}

function cancel() {
  editing.value = false
}

async function load() {
  try {
    const res = await api.get<InfoPage>(`/info/${slug}`);
    info.value = res.data;
    console.log('image full URL:', fullImageUrl.value);
  } catch {
    router.replace('/')
  }
}

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    currentUser.value = JSON.parse(stored)
    hasAccess.value =
      currentUser.value?.role === 'admin' ||
      currentUser.value?.role === 'superAdmin'
  }
  if (!slug) return router.replace('/')
  load()
})
</script>
