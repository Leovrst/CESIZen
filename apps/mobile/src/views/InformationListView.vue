<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Informations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-button
        expand="block"
        color="success"
        v-if="hasAccess"
        @click="showCreate = true"
        class="ion-margin-bottom"
      >
        + Créer une page
      </ion-button>

      <ion-card v-if="showCreate">
        <ion-card-header>
          <ion-card-title>Nouvelle page</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Titre</ion-label>
            <ion-input v-model="newPage.title" placeholder="Titre de la page" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Image</ion-label>
            <input type="file" @change="onFileChange" accept="image/*" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Vidéo (URL YouTube)</ion-label>
            <ion-input v-model="videoUrlInput" placeholder="https://www.youtube.com/watch?v=..." />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Contenu</ion-label>
            <ion-textarea v-model="newPage.content" :rows="6" placeholder="Contenu" />
          </ion-item>

          <ion-button
            expand="block"
            color="primary"
            @click="createPage()"
            :disabled="!newPage.title.trim() || !newPage.content.trim()"
            class="ion-margin-top"
          >
            Enregistrer
          </ion-button>
          <ion-button expand="block" color="medium" @click="showCreate = false" class="ion-margin-top">
            Annuler
          </ion-button>
        </ion-card-content>
      </ion-card>

      <ion-list>
        <ion-item v-for="page in pages" :key="page.id">
          <ion-label>
            <router-link :to="{ name: 'Informations-detail', params: { slug: page.slug } }">
              {{ page.title }}
            </router-link>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-footer class="ion-padding-horizontal">
        <ion-grid>
          <ion-row>
            <ion-col>
              <ion-button expand="block" @click="prevPage" :disabled="page === 1">
                Précédent
              </ion-button>
            </ion-col>
            <ion-col class="ion-text-center">
              Page {{ page }} / {{ totalPages }}
            </ion-col>
            <ion-col>
              <ion-button expand="block" @click="nextPage" :disabled="page === totalPages">
                Suivant
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-footer>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/vue';

interface InfoPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

const pages = ref<InfoPage[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);

const showCreate = ref(false);
const newPage = ref({ title: '', content: '' });
const videoUrlInput = ref('');
const selectedFile = ref<File | null>(null);

const slug = computed(() =>
  newPage.value.title.trim().toLowerCase().replace(/\s+/g, '-')
);

const currentUser = ref<{ role: string } | null>(null);
const hasAccess = computed(
  () =>
    currentUser.value?.role === 'admin' || currentUser.value?.role === 'superAdmin'
);

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

async function loadPages() {
  const res = await api.get<{ items: InfoPage[]; total: number }>('/info', {
    params: { page: page.value, limit: limit.value },
  });
  pages.value = res.data.items;
  total.value = res.data.total;
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    loadPages();
  }
}

function nextPage() {
  if (page.value * limit.value < total.value) {
    page.value++;
    loadPages();
  }
}

const totalPages = computed(() => Math.ceil(total.value / limit.value));

async function createPage() {
  const formData = new FormData();
  formData.append('slug', slug.value);
  formData.append('title', newPage.value.title);
  formData.append('content', newPage.value.content);
  if (selectedFile.value) formData.append('image', selectedFile.value);
  if (videoUrlInput.value.trim())
    formData.append('videoUrl', videoUrlInput.value.trim());

  await api.post('/info/admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  showCreate.value = false;
  newPage.value = { title: '', content: '' };
  videoUrlInput.value = '';
  selectedFile.value = null;
  loadPages();
}

onMounted(() => {
  const stored = localStorage.getItem('user');
  if (stored) currentUser.value = JSON.parse(stored);
  loadPages();
});
</script>