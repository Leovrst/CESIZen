<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mon Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="user && !user.suspended">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Informations personnelles</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="!isEditingProfile">
              <p><strong>Prénom :</strong> {{ profile.firstName }}</p>
              <p><strong>Nom :</strong> {{ profile.lastName }}</p>
              <p><strong>Email :</strong> {{ profile.email }}</p>
              <ion-button size="small" @click="startEditing">
                Modifier mon profil
              </ion-button>
            </div>
            <div v-else>
              <ion-item>
                <ion-label position="stacked">Prénom</ion-label>
                <ion-input v-model="profile.firstName" />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Nom</ion-label>
                <ion-input v-model="profile.lastName" />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input type="email" v-model="profile.email" />
              </ion-item>
              <ion-button color="success" @click="confirmProfileUpdate" class="ion-margin-top">
                Confirmer
              </ion-button>
              <ion-button color="medium" @click="cancelEditing" class="ion-margin-top">
                Annuler
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Mot de passe</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="!isResettingPassword">
              <ion-button color="tertiary" @click="isResettingPassword = true">
                Réinitialiser mon mot de passe
              </ion-button>
            </div>
            <div v-else>
              <ion-item>
                <ion-label position="stacked">Nouveau mot de passe</ion-label>
                <ion-input type="password" v-model:value="newPassword" />
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Confirmer le mot de passe</ion-label>
                <ion-input type="password" v-model="confirmPassword" />
              </ion-item>
              <ion-button color="tertiary" @click="confirmPasswordReset" class="ion-margin-top">
                Confirmer
              </ion-button>
              <ion-button color="medium" @click="cancelPasswordReset" class="ion-margin-top">
                Annuler
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Données personnelles</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="!isRequestingDataDeletion">
                <ion-button expand="block" color="primary" @click="requestDataAccess">
                    Voir mes données personnelles
                </ion-button>
                <ion-button color="warning" @click="isRequestingDataDeletion = true">
                    Demander la suppression de mes données personnelles
                </ion-button>
            </div>
            <div v-else>
              <ion-item>
                <ion-label position="stacked">Raison</ion-label>
                <ion-textarea :rows="3" v-model="deletionReason" />
              </ion-item>
              <ion-button color="warning" @click="confirmDataDeletionRequest" class="ion-margin-top">
                Envoyer la demande
              </ion-button>
              <ion-button color="medium" @click="cancelDataDeletionRequest" class="ion-margin-top">
                Annuler
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" color="danger" @click="logout">
          Déconnexion
        </ion-button>
        
        <ion-button expand="block" color="danger" @click="deleteAccount">
          Supprimer mon compte
        </ion-button>

        <ion-text color="success" v-if="message" class="ion-padding-top">
          {{ message }}
        </ion-text>
        <ion-text color="danger" v-if="error" class="ion-padding-top">
          {{ error }}
        </ion-text>
      </div>

      <div v-if="!user">
        <ion-text class="ion-padding">Vous n'êtes pas connecté. Veuillez vous connecter pour accéder à votre profil.</ion-text>
      </div>

      <div v-if="user && user.suspended">
        <ion-card color="light">
          <ion-card-content>
            <p class="ion-color-danger">Votre compte est suspendu.</p>
            <div v-if="hasPendingRequest">
              <p>Demande en cours de traitement.</p>
            </div>
            <div v-else>
              <form @submit.prevent="submitReactivationRequest">
                <ion-item>
                  <ion-label position="stacked">Commentaire</ion-label>
                  <ion-textarea :rows="4" v-model="reactivationComment" placeholder="Pourquoi souhaitez-vous réactiver" required />
                </ion-item>
                <ion-button type="submit" :disabled="submitting" class="ion-margin-top">
                  {{ submitting ? 'Envoi...' : 'Envoyer la demande' }}
                </ion-button>
                <ion-text color="success" v-if="message" class="ion-padding-top">
                  {{ message }}
                </ion-text>
                <ion-text color="danger" v-if="error" class="ion-padding-top">
                  {{ error }}
                </ion-text>
              </form>
            </div>
          </ion-card-content>
        </ion-card>
        <ion-button expand="block" color="danger" @click="logout">
          Déconnexion
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonLabel,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonText, IonTextarea
} from '@ionic/vue';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  suspended: boolean;
}
interface ReactivationRequest {
  id: number;
  userId: number;
  comment: string;
  status: string;
}

const router = useRouter();
const user = ref<User | null>(null);
const profile = reactive({ firstName: '', lastName: '', email: '' });
const isEditingProfile = ref(false);
const isResettingPassword = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const isRequestingDataDeletion = ref(false);
const deletionReason = ref('');
const reactivationComment = ref('');
const reactivationRequests = ref<ReactivationRequest[]>([]);
const submitting = ref(false);
const message = ref('');
const error = ref('');

onMounted(async () => {
  const stored = localStorage.getItem('user');
  if (stored) {
    user.value = JSON.parse(stored);
    if (user.value) {
      profile.firstName = user.value.firstName;
      profile.lastName = user.value.lastName;
      profile.email = user.value.email;
    }
    await fetchReactivationRequests();
  }
});

function startEditing() { isEditingProfile.value = true; }
function cancelEditing() {
  isEditingProfile.value = false;
  if (user.value) {
    profile.firstName = user.value.firstName;
    profile.lastName = user.value.lastName;
    profile.email = user.value.email;
  }
}
async function confirmProfileUpdate() {
  if (!user.value) return;
  try {
    const res = await api.put(`/users/${user.value.id}`, { ...profile });
    user.value = res.data;
    localStorage.setItem('user', JSON.stringify(res.data));
    message.value = 'Profil mis à jour avec succès.';
    isEditingProfile.value = false;
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur lors de la mise à jour';
  }
}

function cancelPasswordReset() {
  isResettingPassword.value = false;
  newPassword.value = confirmPassword.value = '';
}
async function confirmPasswordReset() {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.';
    return;
  }
  if (!user.value) return;
  try {
    await api.post(`/users/reset-password/${user.value.id}`, { newPassword: newPassword.value });
    message.value = 'Mot de passe réinitialisé.';
    cancelPasswordReset();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur lors de la réinitialisation';
  }
}

async function deleteAccount() {
  if (!user.value) return;
  if (!confirm('Êtes-vous sûr ?')) return;
  try {
    await api.delete(`/users/${user.value.id}`);
    localStorage.clear();
    router.push('/login');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur suppression compte';
  }
}

async function requestDataAccess() {
  if (!user.value) return;
  try {
    await api.post('/users/data-access-request');
    message.value = "Demande d'accès envoyée.";
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur demande accès';
  }
}

function cancelDataDeletionRequest() {
  isRequestingDataDeletion.value = false;
  deletionReason.value = '';
}
async function confirmDataDeletionRequest() {
  if (!deletionReason.value.trim()) {
    error.value = 'Renseignez une raison.';
    return;
  }
  if (!user.value) return;
  try {
    await api.post('/users/data-deletion-request', { reason: deletionReason.value });
    message.value = 'Demande de suppression envoyée.';
    cancelDataDeletionRequest();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur demande suppression';
  }
}

async function fetchReactivationRequests() {
    if (!user.value) return;
    const res = await api.get<ReactivationRequest[]>(`/reactivation-requests`);
    reactivationRequests.value = res.data.filter(r => r.userId === user.value!.id);
}

const hasPendingRequest = computed(() =>
  reactivationRequests.value.some(r => r.status === 'En attente')
);

async function submitReactivationRequest() {
  if (!reactivationComment.value.trim() || !user.value) return;
  submitting.value = true;
  try {
    await api.post('/reactivation-requests', { comment: reactivationComment.value, userId: user.value.id });
    message.value = 'Demande envoyée.';
    reactivationComment.value = '';
    await fetchReactivationRequests();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur envoi demande';
  } finally {
    submitting.value = false;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login').then(() => {
    window.location.reload();
  });
}
</script>
