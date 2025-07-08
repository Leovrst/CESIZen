<template>
  <ion-app>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/home">
          <ion-icon :name="currentRoute==='home' ? 'home' : 'home-outline'" />
          <ion-label>Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="diagnostic"
          href="/diagnostic"
        >
          <ion-icon :name="currentRoute==='diagnostic' ? 'pulse' : 'pulse-outline'" />
          <ion-label>Diagnostic</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-if="loggedIn"
          tab="profile"
          href="/profile"
        >
          <ion-icon :name="currentRoute==='profile' ? 'person' : 'person-outline'" />
          <ion-label>Profil</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="informations"
          href="/informations"
        >
          <ion-icon :name="currentRoute==='informations' ? 'information-circle' : 'information-circle-outline'" />
          <ion-label>Infos</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-if="hasDashboardAccess"
          tab="dashboard"
          href="/dashboard"
        >
          <ion-icon :name="currentRoute==='dashboard' ? 'settings' : 'settings-outline'" />
          <ion-label>Admin</ion-label>
        </ion-tab-button>

        <ion-tab-button
          v-if="!loggedIn"
          tab="login"
          href="/login"
        >
          <ion-icon :name="currentRoute==='login' ? 'log-in' : 'log-in-outline'" />
          <ion-label>Connexion</ion-label>
        </ion-tab-button>
        <ion-tab-button
          v-if="!loggedIn"
          tab="register"
          href="/register"
        >
          <ion-icon :name="currentRoute==='register' ? 'person-add' : 'person-add-outline'" />
          <ion-label>Inscription</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="support" href="/support">
          <ion-icon :name="currentRoute==='support' ? 'help-buoy' : 'help-buoy-outline'" />
          <ion-label>Support</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentRoute = computed(() => route.name as string)

const loggedIn = computed(() => !!localStorage.getItem('token'))

const userJson = localStorage.getItem('user')
const user = userJson ? JSON.parse(userJson) : null
const hasDashboardAccess = computed(() => user && (user.role === 'admin' || user.role === 'superAdmin'))
</script>
