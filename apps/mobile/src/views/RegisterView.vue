<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inscription</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="register">
        <ion-item>
          <ion-label position="stacked">Prénom</ion-label>
          <ion-input
            type="text"
            v-model="firstName"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Nom</ion-label>
          <ion-input
            type="text"
            v-model="lastName"
            required
          ></ion-input>
        </ion-item>

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
          S'inscrire
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
import api from '../services/api';

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const error = ref('');

const router = useRouter();

async function register() {
  try {
    const response = await api.post('/users/register', {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
    });
    console.log('Inscription réussie:', response.data);
    router.push('/login');
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || 'Erreur inconnue';
  }
}
</script>
