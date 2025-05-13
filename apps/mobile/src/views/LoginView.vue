<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="login">
        <ion-item>
          <ion-label position="stacked">Email</ion-label>
          <ion-input
            type="email"
            v-model="email"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Mot de passe</ion-label>
          <ion-input
            type="password"
            v-model="password"
            required
          ></ion-input>
        </ion-item>

        <ion-button
          expand="block"
          type="submit"
          class="ion-margin-top"
        >
          Se connecter
        </ion-button>
      </form>

      <ion-text color="danger" v-if="error" class="ion-padding-top">
        {{ error }}
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/vue';

const email    = ref<string>('');
const password = ref<string>('');
const error    = ref<string>('');

const router = useRouter();

async function login() {
  try {
    const { data } = await api.post('/users/login', {
      email:    email.value,
      password: password.value,
    });
    localStorage.setItem('token',     data.accessToken);
    localStorage.setItem('user',      JSON.stringify(data.user));
    await router.push('/');
    window.location.reload();
  } catch (err: any) {
    console.error('Erreur API login :', err);
    error.value = err.response?.data?.message
      || "Une erreur s'est produite lors de la connexion.";
  }
}
</script>
