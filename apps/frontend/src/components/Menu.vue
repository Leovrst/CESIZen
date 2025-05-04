<template>
  <div>
    <nav class="bg-gray-200 p-4 flex justify-between items-center">
      <div class="flex space-x-4">
        <RouterLink
          v-if="currentRouteName !== 'home'"
          to="/"
          class="hover:underline"
        >
          Accueil
        </RouterLink>

        <template v-if="loggedIn">
          <RouterLink
            v-if="currentRouteName !== 'auto-diagnostic'"
            to="/auto-diagnostic"
            class="hover:underline"
          >
            Auto Diagnostic
          </RouterLink>
          <RouterLink
            v-if="currentRouteName !== 'profile'"
            to="/profile"
            class="hover:underline"
          >
            Profil
          </RouterLink>
          <RouterLink
            v-if="currentRouteName !== 'infos'"
            to="/infos"
            class="hover:underline"
          >
            Informations
          </RouterLink>
          <RouterLink
            v-if="hasDashboardAccess && currentRouteName !== 'dashboard'"
            to="/dashboard"
            class="hover:underline"
          >
            Dashboard
          </RouterLink>
        </template>

        <template v-else>
          <RouterLink
            v-if="currentRouteName !== 'login'"
            to="/login"
            class="hover:underline"
          >
            Connexion
          </RouterLink>
          <RouterLink
            v-if="currentRouteName !== 'register'"
            to="/register"
            class="hover:underline"
          >
            Inscription
          </RouterLink>
        </template>
      </div>

      <button
        v-if="loggedIn"
        @click="logout"
        class="bg-red-500 text-white px-4 py-2 rounded"
      >
        Déconnexion
      </button>
    </nav>

    <main>
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';

const router = useRouter();
const route = useRoute();

const currentRouteName = computed(() => route.name);

const loggedIn = computed(() => !!localStorage.getItem('token'));

const userJson = localStorage.getItem('user');
const user = userJson ? JSON.parse(userJson) : null;

const hasDashboardAccess = computed(() => {
  return user && (user.role === 'admin' || user.role === 'superAdmin');
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login').then(() => {
    window.location.reload();
  });
}
</script>
