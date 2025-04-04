<!-- src/views/HomeView.vue -->
<template>
    <div>
      <!-- Menu de navigation -->
      <nav class="bg-gray-200 p-4 flex justify-between items-center">
        <div class="flex space-x-4">
          <!-- Si l'utilisateur est connecté, afficher le menu complet -->
          <template v-if="loggedIn">
            <router-link to="/auto-diagnostic" class="hover:underline">Auto Diagnostic</router-link>
            <router-link to="/profile" class="hover:underline">Profil</router-link>
            <router-link v-if="isAdmin" to="/admin" class="hover:underline">Admin</router-link>
            <router-link to="/infos" class="hover:underline">Informations</router-link>
          </template>
          <!-- Sinon, afficher uniquement les liens vers la connexion et l'inscription -->
          <template v-else>
            <router-link to="/login" class="hover:underline">Connexion</router-link>
            <router-link to="/register" class="hover:underline">Inscription</router-link>
          </template>
        </div>
        <!-- Bouton de déconnexion visible seulement si l'utilisateur est connecté -->
        <button v-if="loggedIn" @click="logout" class="bg-red-500 text-white px-4 py-2 rounded">
          Déconnexion
        </button>
      </nav>
  
      <!-- Contenu principal -->
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
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  
  // Vérifier la présence d'un token dans le localStorage pour déterminer si l'utilisateur est connecté.
  const token = localStorage.getItem('token');
  
  // Pour déterminer si l'utilisateur est admin, on peut stocker un objet utilisateur dans le localStorage.
  // Par exemple, lors du login, vous pourriez sauvegarder un objet JSON avec la propriété isAdmin.
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  
  const loggedIn = computed(() => !!token);
  const isAdmin = computed(() => user && user.isAdmin === true);
  
  const router = useRouter();
  
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Si vous stockez les infos utilisateur
    router.push('/login');
  }
  </script>
