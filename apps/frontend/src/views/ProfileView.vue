<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-4">Mon Profil</h1>

    <div v-if="user && !user.suspended" class="bg-white shadow-md rounded p-6">
      <h2 class="text-xl font-bold mb-4">Informations personnelles</h2>
      <div class="mb-6">
        <div v-if="!isEditingProfile">
          <p><strong>Prénom :</strong> {{ profile.firstName }}</p>
          <p><strong>Nom :</strong> {{ profile.lastName }}</p>
          <p><strong>Email :</strong> {{ profile.email }}</p>
          <button @click="startEditing" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            Modifier mon profil
          </button>
        </div>
        <div v-else>
          <div class="mb-4">
            <label class="block text-gray-700">Prénom</label>
            <input v-model="profile.firstName" type="text" class="border p-2 w-full" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Nom</label>
            <input v-model="profile.lastName" type="text" class="border p-2 w-full" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Email</label>
            <input v-model="profile.email" type="email" class="border p-2 w-full" />
          </div>
          <button @click="confirmProfileUpdate" class="bg-green-500 text-white px-4 py-2 rounded mr-2">
            Confirmer
          </button>
          <button @click="cancelEditing" class="bg-gray-500 text-white px-4 py-2 rounded">
            Annuler
          </button>
        </div>
      </div>

      <div class="mb-6">
        <div v-if="!isResettingPassword">
          <button @click="isResettingPassword = true" class="bg-purple-500 text-white px-4 py-2 rounded">
            Réinitialiser mon mot de passe
          </button>
        </div>
        <div v-else>
          <div class="mb-4">
            <label class="block text-gray-700">Nouveau mot de passe</label>
            <input v-model="newPassword" type="password" class="border p-2 w-full" />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Confirmer le nouveau mot de passe</label>
            <input v-model="confirmPassword" type="password" class="border p-2 w-full" />
          </div>
          <button @click="confirmPasswordReset" class="bg-purple-500 text-white px-4 py-2 rounded mr-2">
            Confirmer
          </button>
          <button @click="cancelPasswordReset" class="bg-gray-500 text-white px-4 py-2 rounded">
            Annuler
          </button>
        </div>
      </div>

      <div class="mb-6">
        <button @click="requestDataAccess" class="bg-green-500 text-white px-4 py-2 rounded">
          Demander l'accès à mes données personnelles
        </button>
      </div>

      <div class="mb-6">
        <div v-if="!isRequestingDataDeletion">
          <button @click="isRequestingDataDeletion = true" class="bg-yellow-500 text-white px-4 py-2 rounded">
            Demander la suppression de mes données personnelles
          </button>
        </div>
        <div v-else>
          <div class="mb-4">
            <label class="block text-gray-700">Raison de la demande de suppression</label>
            <textarea v-model="deletionReason" class="border p-2 w-full" rows="3"></textarea>
          </div>
          <button @click="confirmDataDeletionRequest" class="bg-yellow-500 text-white px-4 py-2 rounded mr-2">
            Envoyer la demande
          </button>
          <button @click="cancelDataDeletionRequest" class="bg-gray-500 text-white px-4 py-2 rounded">
            Annuler
          </button>
        </div>
      </div>

      <div class="mb-6">
        <button @click="deleteAccount" class="bg-red-500 text-white px-4 py-2 rounded">
          Supprimer mon compte
        </button>
      </div>

      <p v-if="message" class="text-green-600 mt-4">{{ message }}</p>
      <p v-if="error" class="text-red-600 mt-4">{{ error }}</p>
    </div>
    <div v-if="!user" class="mt-6 p-4 border rounded">
      <p>Vous n'êtes pas connecté. Veuillez vous connecter pour accéder à votre profil.</p>
    </div>

    <div v-if="user && user.suspended" class="mt-6 p-4 border rounded bg-red-50">
      <p class="text-red-600 mb-4">
        Votre compte est suspendu. Vous pouvez soumettre une demande de réactivation ci-dessous.
      </p>

      <div v-if="hasPendingRequest" class="mb-4 p-4 bg-yellow-100 rounded">
        <p class="text-yellow-800">
          Votre demande de réactivation est en cours de traitement par nos administrateurs.
        </p>
      </div>

      <form
        v-else
        @submit.prevent="submitReactivationRequest"
        class="bg-white shadow-sm rounded p-6"
      >
        <h2 class="text-xl font-bold mb-2">Demande de réactivation</h2>

        <div class="mb-4">
          <label class="block text-gray-700 mb-1">Commentaire</label>
          <textarea
            v-model="reactivationComment"
            class="border p-2 w-full"
            rows="4"
            placeholder="Expliquez brièvement pourquoi vous souhaitez la réactivation"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {{ submitting ? 'Envoi en cours…' : 'Envoyer la demande' }}
        </button>
        <p v-if="message" class="text-green-600 mt-4">{{ message }}</p>
        <p v-if="error" class="text-red-600 mt-4">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

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
  user: User;
  comment: string;
  status: string; 
  createdAt: string;
}

const router = useRouter();

const user = ref<User | null>(null);
const profile = reactive({
  firstName: '',
  lastName: '',
  email: '',
});
const isEditingProfile       = ref<boolean>(false);
const isResettingPassword    = ref<boolean>(false);
const newPassword            = ref<string>('');
const confirmPassword        = ref<string>('');
const isRequestingDataDeletion = ref<boolean>(false);
const deletionReason         = ref<string>('');
const reactivationComment    = ref<string>('');

const reactivationRequests = ref<ReactivationRequest[]>([]);
const submitting           = ref<boolean>(false);

const message = ref<string>('');
const error   = ref<string>('');

onMounted(async () => {
  const stored = localStorage.getItem('user');
  if (stored) {
    user.value = JSON.parse(stored);
    if (user.value) {
      profile.firstName = user.value.firstName;
      profile.lastName  = user.value.lastName;
      profile.email     = user.value.email;
    }
  }
  await fetchReactivationRequests();
});

function startEditing() { isEditingProfile.value = true; }
function cancelEditing() {
  isEditingProfile.value = false;
  if (user.value) {
    profile.firstName = user.value.firstName;
    profile.lastName  = user.value.lastName;
    profile.email     = user.value.email;
  }
}
async function confirmProfileUpdate() {
  if (!user.value) return;
  try {
    const res = await api.put(`/users/${user.value.id}`, {
      firstName: profile.firstName,
      lastName:  profile.lastName,
      email:     profile.email,
    });
    user.value = res.data;
    localStorage.setItem('user', JSON.stringify(res.data));
    message.value = 'Profil mis à jour avec succès.';
    isEditingProfile.value = false;
  } catch (e: any) {
    console.error(e);
    error.value = e.response?.data?.message || 'Erreur lors de la mise à jour du profil.';
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
    message.value = 'Mot de passe réinitialisé avec succès.';
    cancelPasswordReset();
  } catch (e: any) {
    console.error(e);
    error.value = e.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe.';
  }
}

async function deleteAccount() {
  if (!user.value) return;
  if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) return;
  try {
    await api.delete(`/users/${user.value.id}`);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  } catch (e: any) {
    console.error(e);
    error.value = e.response?.data?.message || 'Erreur lors de la suppression du compte.';
  }
}

async function requestDataAccess() {
  if (!user.value) return;
  try {
    await api.post('/users/data-access-request');
    message.value = "Demande d'accès aux données envoyée.";
  } catch (e: any) {
    console.error(e);
    error.value = e.response?.data?.message || "Erreur lors de la demande d'accès aux données.";
  }
}

function cancelDataDeletionRequest() {
  isRequestingDataDeletion.value = false;
  deletionReason.value = '';
}

async function confirmDataDeletionRequest() {
  if (!deletionReason.value.trim()) {
    error.value = 'Veuillez renseigner une raison pour votre demande.';
    return;
  }
  if (!user.value) return;
  try {
    await api.post('/users/data-deletion-request', { reason: deletionReason.value });
    message.value = 'Demande de suppression des données envoyée.';
    cancelDataDeletionRequest();
  } catch (e: any) {
    console.error(e);
    error.value = e.response?.data?.message || 'Erreur lors de la demande de suppression des données.';
  }
}

async function fetchReactivationRequests() {
  if (!user.value) return;
  try {
    const res = await api.get<ReactivationRequest[]>('/reactivation-requests');
    reactivationRequests.value = res.data.filter(
      req => req.user.id === user.value!.id
    );
  } catch (e: any) {
    console.error('Erreur fetch reactivation-requests', e);
  }
}

const hasPendingRequest = computed(() => {
  return reactivationRequests.value.some(r => r.status === 'En attente');
});

async function submitReactivationRequest() {
  if (!user.value) return;
  if (!reactivationComment.value.trim()) {
    error.value = 'Merci de saisir un commentaire.';
    return;
  }
  submitting.value = true;
  error.value = '';
  message.value = '';
  try {
    await api.post('/reactivation-requests', {
      comment: reactivationComment.value,
      userId:  user.value.id,
    });
    message.value = 'Votre demande de réactivation a bien été envoyée.';
    reactivationComment.value = '';

    await fetchReactivationRequests();
  } catch (e: any) {
    console.error(e);
    error.value = e.response?.data?.message || 'Erreur lors de l’envoi de la demande.';
  } finally {
    submitting.value = false;
  }
}
</script>
