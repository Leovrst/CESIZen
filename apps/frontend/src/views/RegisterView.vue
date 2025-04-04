<!-- src/views/RegisterView.vue -->
<template>
    <div class="max-w-md mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Inscription</h1>
      <form @submit.prevent="register">
        <div class="mb-4">
          <label for="firstName" class="block text-gray-700">Prénom</label>
          <input
            id="firstName"
            type="text"
            v-model="firstName"
            class="border p-2 w-full"
            required
          />
        </div>
        <div class="mb-4">
          <label for="lastName" class="block text-gray-700">Nom</label>
          <input
            id="lastName"
            type="text"
            v-model="lastName"
            class="border p-2 w-full"
            required
          />
        </div>
        <div class="mb-4">
          <label for="email" class="block text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            class="border p-2 w-full"
            required
          />
        </div>
        <div class="mb-4">
          <label for="password" class="block text-gray-700">Mot de passe</label>
          <input
            id="password"
            type="password"
            v-model="password"
            class="border p-2 w-full"
            required
          />
        </div>
        <button type="submit" class="bg-green-500 text-white py-2 px-4 rounded">
          S'inscrire
        </button>
      </form>
      <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '@/services/api';
  
  const firstName = ref<string>('');
  const lastName = ref<string>('');
  const email = ref<string>('');
  const password = ref<string>('');
  const error = ref<string>('');
  
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
      error.value =
        err.response?.data?.message;
    }
  }
  </script>
