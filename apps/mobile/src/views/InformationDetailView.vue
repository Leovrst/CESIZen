<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
        <ion-back-button 
          default-href="/informations" 
          router-direction="back" 
          text="" 
        />
        </ion-buttons>
        <ion-title>{{ info?.title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="info">
        <ion-img v-if="info.imageUrl" :src="fullImageUrl" class="ion-margin-bottom" />

        <div class="ion-margin-bottom" v-html="info.content"></div>

        <ion-card v-if="info.videoUrl">
          <iframe
            :src="embedUrl"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="w-full h-64"
          ></iframe>
        </ion-card>

        <ion-button expand="block" color="warning" v-if="hasAccess" @click="startEdit()">
          ✏️ Éditer
        </ion-button>

        <ion-card v-if="editing">
          <ion-card-header>
            <ion-card-title>Modifier la page</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Titre</ion-label>
              <ion-input v-model="form.title" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Image (remplace si fichier choisi)</ion-label>
              <input type="file" @change="onEditFileChange" accept="image/*" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Vidéo (URL YouTube)</ion-label>
              <ion-input v-model="form.videoUrl" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Contenu</ion-label>
              <ion-textarea v-model="form.content" :rows="6" />
            </ion-item>

            <ion-button expand="block" color="success" @click="save()" class="ion-margin-top">
              Enregistrer
            </ion-button>
            <ion-button expand="block" color="medium" @click="cancel()" class="ion-margin-top">
              Annuler
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
  IonImg,
  IonButtons,
  IonBackButton,
} from '@ionic/vue';

interface InfoPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;

const info = ref<InfoPage | null>(null);
const editing = ref(false);
const form = ref({ title: '', content: '', videoUrl: '' });
const editFile = ref<File | null>(null);

const currentUser = ref<{ role: string } | null>(null);
const hasAccess = computed(
  () =>
    currentUser.value?.role === 'admin' || currentUser.value?.role === 'superAdmin'
);

const fullImageUrl = computed(() =>
  info.value?.imageUrl ? `${api.defaults.baseURL}${info.value.imageUrl}` : ''
);

const embedUrl = computed(() => {
  if (!info.value?.videoUrl) return '';
  const match = info.value.videoUrl.match(/(?:youtu\.be\/|v=)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
});

function startEdit() {
  if (!info.value) return;
  form.value.title = info.value.title;
  form.value.content = info.value.content;
  form.value.videoUrl = info.value.videoUrl || '';
  editing.value = true;
}

function onEditFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  editFile.value = input.files?.[0] ?? null;
}

async function save() {
  if (!info.value) return;
  const fd = new FormData();
  fd.append('title', form.value.title);
  fd.append('content', form.value.content);
  fd.append('videoUrl', form.value.videoUrl);
  if (editFile.value) fd.append('image', editFile.value);

  await api.put(`/info/admin/${info.value.id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  editing.value = false;
  load();
}

function cancel() {
  editing.value = false;
}

async function load() {
  try {
    const res = await api.get<InfoPage>(`/info/${slug}`);
    info.value = res.data;
  } catch {
    router.replace('/');
  }
}

onMounted(() => {
  const stored = localStorage.getItem('user');
  if (stored) currentUser.value = JSON.parse(stored);
  if (!slug) return router.replace('/');
  load();
});
</script>
