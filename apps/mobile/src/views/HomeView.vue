<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Accueil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="hero-content">
      <h1 class="hero-title">Bienvenue sur CESIZen</h1>
      <p class="hero-subtitle">
        Gérez votre santé mentale de façon simple et zen.
      </p>
      <div class="logo-wrapper">
        <ion-img :src="logo" class="logo" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonImg } from '@ionic/vue';
import logo from '@/assets/cesizen-logo.png';
</script>

<style scoped>
.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #e0f7fa, #ffffff);
  min-height: 100%;
}

.logo-wrapper {
  margin-bottom: 1.5rem;
}

.logo {
  width: 400px;
  max-width: 90%;
  justify-self: center;
  padding-top: 200px;
  height: auto;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.hero-subtitle {
  font-size: 1rem;
  color: #555;
  line-height: 1.4;
  max-width: 90%;
}

@media (max-width: 400px) {
  .hero-title {
    font-size: 1.5rem;
  }
  .logo {
    width: 100px;
  }
}
</style>
