<!-- src/views/LoginView.vue -->
<template>
    <div class="max-w-md mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Connexion</h1>
      <form @submit.prevent="login">
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
        <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded">
          Se connecter
        </button>
      </form>
      <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import api from '@/services/api';
  
  const email = ref<string>('');
  const password = ref<string>('');
  const error = ref<string>('');
  
  const router = useRouter();
  
  async function login() {
    try {
      const response = await api.post('/users/login', {
        email: email.value,
        password: password.value,
      });
      localStorage.setItem('token', response.data.token);
      if(response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      router.push('/');
    } catch (err: any) {
      console.error(err);
      error.value = err.response?.data?.message || "Une erreur s'est produite lors de la connexion.";
    }
  }
  </script>
