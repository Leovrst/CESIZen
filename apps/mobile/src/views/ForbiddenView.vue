<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="danger">
        <ion-title>Accès refusé (403)</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-icon name="ban" size="large" color="danger" style="font-size: 64px; margin: 32px 0 12px 0;" />
      <h2>Compte temporairement bloqué</h2>
      <p>
        Vous avez effectué trop de tentatives de connexion.<br>
        Pour des raisons de sécurité, votre compte a été temporairement suspendu.<br>
        Un administrateur étudiera votre demande de réactivation.
      </p>
      <ion-button color="primary" router-link="/support" class="ion-margin-top">
        Contacter le support
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/vue'
</script>
