<template>
    <div class="max-w-4xl mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Bienvenue sur votre tableau de bord. Ici, vous pouvez gérer votre compte et consulter vos données.</p>
      <button @click="logout" class="mt-4 bg-red-500 text-white py-2 px-4 rounded">
        Se déconnecter
      </button>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  function logout() {
    localStorage.removeItem('token');
    router.push('/login');
  }
  </script>