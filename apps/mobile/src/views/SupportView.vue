<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Support</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Créer un ticket de support</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Titre de la demande</ion-label>
            <ion-input v-model="title" required />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea v-model="description" :rows="5" required />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Type de demande</ion-label>
            <ion-select v-model="type" placeholder="Sélectionner un type">
              <ion-select-option v-for="t in types" :key="t.value" :value="t.value">
                {{ t.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-button expand="block" color="primary" class="ion-margin-top" @click="submitTicket" :disabled="loading">
            {{ loading ? "Envoi..." : "Envoyer la demande" }}
          </ion-button>
          <ion-text color="success" v-if="message" class="ion-padding-top">{{ message }}</ion-text>
          <ion-text color="danger" v-if="error" class="ion-padding-top">{{ error }}</ion-text>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import api from '@/services/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonText
} from '@ionic/vue';

const title = ref('');
const description = ref('');
const type = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');

const types = [
  { label: "Bug", value: "bug" },
  { label: "Proposition d'amélioration", value: "enhancement" },
  { label: "Informations", value: "question" },
  { label: "Problème d'accès", value: "access" },
  { label: "Autre", value: "other" },
];

watch(message, val => {
  if (val) setTimeout(() => (message.value = ''), 5000);
});
watch(error, val => {
  if (val) setTimeout(() => (error.value = ''), 5000);
});

async function submitTicket() {
  if (!title.value.trim() || !description.value.trim() || !type.value) {
    error.value = "Merci de remplir tous les champs";
    return;
  }
  loading.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.post('/support', {
      title: title.value,
      description: description.value,
      type: type.value,
    });
    message.value = "Ticket créé avec succès !";
    title.value = '';
    description.value = '';
    type.value = '';
  } catch (e: any) {
    error.value = e.response?.data?.message || "Erreur lors de la création du ticket.";
  } finally {
    loading.value = false;
  }
}
</script>
 