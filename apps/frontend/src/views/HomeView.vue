<template>
    <div>
      <main class="p-4">
        <div v-if="loggedIn">
          <h1 class="text-3xl font-bold mb-4">Bienvenue sur CESIZen</h1>
          <p>Vous pouvez accéder aux différentes fonctionnalités de l'application via le menu ci-dessus.</p>
        </div>
        <div v-else>
          <h1 class="text-3xl font-bold mb-4">Bienvenue sur CESIZen</h1>
          <p>
            Vous n'êtes pas connecté. Veuillez vous connecter ou vous inscrire pour accéder à l'ensemble des fonctionnalités de l'application.
          </p>
        </div>
      </main>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { computed } from 'vue';
  
  // Vérifier la présence d'un token dans le localStorage pour déterminer si l'utilisateur est connecté.
  const token = localStorage.getItem('token');
  
  const loggedIn = computed(() => !!token);
  </script>
