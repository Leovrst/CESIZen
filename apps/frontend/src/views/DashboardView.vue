<template>
  <div class="max-w-6xl mx-auto p-4">
    <div v-if="hasAccess">
      <h1 class="text-3xl font-bold mb-4">
        Bonjour 
        <span v-if="currentUser && currentUser.role === 'superAdmin'">super admin</span>
        <span v-else-if="currentUser && currentUser.role === 'admin'">admin</span>
        {{ currentUser?.firstName || '' }} !
      </h1>

      <div class="mb-4 border-b">
        <button
          class="py-2 px-4"
          :class="{ 'border-b-2 border-blue-500': activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          Utilisateurs
        </button>
        <button
          class="py-2 px-4 ml-4"
          :class="{ 'border-b-2 border-blue-500': activeTab === 'requests' }"
          @click="activeTab = 'requests'"
        >
          Demandes de suppression
        </button>
        <button 
        class="py-2 px-4"
        :class="{ 'border-b-2 border-blue-500': activeTab === 'reactivation' }"
        @click="activeTab = 'reactivation'"
      >
        Demandes de réactivation
      </button>
      </div>

      <div v-if="activeTab === 'users'">
        <div class="mb-4">
          <button @click="toggleCreateForm" class="bg-green-500 text-white px-4 py-2 rounded">
            Créer un compte
          </button>
        </div>

        <div v-if="showCreateForm" class="mb-4 p-4 border rounded">
          <h2 class="text-xl font-semibold mb-2">Créer un nouveau compte</h2>
          <form @submit.prevent="createAccount">
            <div class="mb-2">
              <label class="block text-gray-700">Prénom</label>
              <input v-model="newAccount.firstName" type="text" class="border p-2 w-full" required />
            </div>
            <div class="mb-2">
              <label class="block text-gray-700">Nom</label>
              <input v-model="newAccount.lastName" type="text" class="border p-2 w-full" required />
            </div>
            <div class="mb-2">
              <label class="block text-gray-700">Email</label>
              <input v-model="newAccount.email" type="email" class="border p-2 w-full" required />
            </div>
            <div class="mb-2">
              <label class="block text-gray-700">Mot de passe</label>
              <input v-model="newAccount.password" type="password" class="border p-2 w-full" required />
            </div>
            <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded mr-2">
              Créer
            </button>
            <button type="button" @click="toggleCreateForm" class="bg-gray-500 text-white px-4 py-2 rounded">
              Annuler
            </button>
          </form>
        </div>

        <table class="min-w-full border">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 border">ID</th>
              <th class="px-4 py-2 border">Prénom</th>
              <th class="px-4 py-2 border">Nom</th>
              <th class="px-4 py-2 border">Email</th>
              <th class="px-4 py-2 border">Rôle</th>
              <th class="px-4 py-2 border">Statut</th>
              <th class="px-4 py-2 border">Créé le</th>
              <th class="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
              <td class="px-4 py-2 border">{{ u.id }}</td>
              <td class="px-4 py-2 border">{{ u.firstName }}</td>
              <td class="px-4 py-2 border">{{ u.lastName }}</td>
              <td class="px-4 py-2 border">{{ u.email }}</td>
              <td class="px-4 py-2 border">{{ formatRole(u.role) }}</td>
              <td class="px-4 py-2 border">{{ u.suspended ? 'Suspendu' : 'Actif' }}</td>
              <td class="px-4 py-2 border">{{ formatDate(u.registeredAt) }}</td>
              <td class="px-4 py-2 border relative">
                <div v-if="canManageUser(u)" class="relative" @click="toggleActionMenu(u.id)">
                  <span class="cursor-pointer">⋮</span>
                  <div
                    v-if="actionMenuOpen === u.id"
                    class="absolute right-0 mt-2 w-40 bg-white border shadow-md z-10"
                  >
                    <button
                      v-if="currentUser && currentUser.role === 'superAdmin' && u.role !== 'superAdmin'"
                      @click.stop="toggleAdmin(u)"
                      class="block w-full text-left px-2 py-1 hover:bg-gray-100"
                    >
                      {{ u.role === 'admin' ? 'Retirer admin' : 'Rendre admin' }}
                    </button>
                    <button
                      v-if="u.role === 'user' && !u.suspended"
                      @click.stop="toggleSuspension(u)"
                      class="block w-full text-left px-2 py-1 hover:bg-gray-100"
                    >
                      Suspendre
                    </button>
                    <button
                      v-if="u.role === 'user'"
                      @click.stop="deleteUser(u)"
                      class="block w-full text-left px-2 py-1 hover:bg-gray-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="activeTab === 'requests'">
        <h2 class="text-xl font-semibold mb-2">Demandes de suppression des données personnelles</h2>
        <table class="min-w-full border">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 border">ID Demande</th>
              <th class="px-4 py-2 border">ID Utilisateur</th>
              <th class="px-4 py-2 border">Email Utilisateur</th>
              <th class="px-4 py-2 border">Raison</th>
              <th class="px-4 py-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in deletionRequests" :key="req.id" class="hover:bg-gray-50">
              <td class="px-4 py-2 border">{{ req.id }}</td>
              <td class="px-4 py-2 border">{{ req.userId }}</td>
              <td class="px-4 py-2 border">{{ req.email }}</td>
              <td class="px-4 py-2 border">{{ req.reason }}</td>
              <td class="px-4 py-2 border">{{ req.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'reactivation'">
      <h2 class="text-xl font-semibold mb-2">Demandes de réactivation</h2>
      <table class="min-w-full border">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 border">ID Demande</th>
            <th class="px-4 py-2 border">Prénom</th>
            <th class="px-4 py-2 border">Nom</th>
            <th class="px-4 py-2 border">Commentaire</th>
            <th class="px-4 py-2 border">Date</th>
            <th class="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in sortedReactivationRequests" :key="req.id" class="hover:bg-gray-50">
            <td class="px-4 py-2 border">{{ req.id }}</td>
            <td class="px-4 py-2 border">{{ req.user.firstName }}</td>
            <td class="px-4 py-2 border">{{ req.user.lastName }}</td>
            <td class="px-4 py-2 border">{{ req.comment }}</td>
            <td class="px-4 py-2 border">{{ formatDate(req.createdAt) }}</td>
            <td class="px-4 py-2 border">{{ formatStatus(req.status) }}</td> 
            <td class="px-4 py-2 border relative">
              <div v-if="req.status === 'En attente'" class="relative" @click.stop="toggleRequestMenu(req.id)">
                <span class="cursor-pointer">⋮</span>
                <div v-if="actionMenuOpen === req.id" class="absolute right-0 mt-2 w-40 bg-white border shadow-md z-10">
                  <button 
                    @click.stop="approveRequest(req)"
                    class="block w-full text-left px-2 py-1 hover:bg-gray-100"
                  >
                    Accepter
                  </button>
                  <button 
                    @click.stop="rejectRequest(req)"
                    class="block w-full text-left px-2 py-1 hover:bg-gray-100"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

      <p v-if="message" class="text-green-600 mt-4">{{ message }}</p>
      <p v-if="error" class="text-red-600 mt-4">{{ error }}</p>
      </div>
      <div v-else>
        <h1 class="text-3xl font-bold mb-4">Accès refusé</h1>
        <p>Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
        <p>Veuillez contacter un administrateur si vous pensez que c'est une erreur.</p>
        <button @click="router.push('/')" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Retour à l'accueil
        </button>
      </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';


interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  suspended: boolean;
  registeredAt: string;
}

interface DeletionRequest {
  id: number;
  userId: number;
  email: string;
  reason: string;
  date: string;
}

interface ReactivationRequest {
  id: string;
  user: User;
  comment: string;
  createdAt: string;
  status: string;
}

const sortedReactivationRequests = computed(() => {
  return [...reactivationRequests.value]
    .sort((a, b) => {
      if (a.status === 'En attente' && b.status !== 'En attente') return -1;
      if (a.status !== 'En attente' && b.status === 'En attente') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
});

const router = useRouter();

const currentUser = ref<User | null>(null);
const users = ref<User[]>([]);
const deletionRequests = ref<DeletionRequest[]>([]);
const reactivationRequests = ref<ReactivationRequest[]>([]);
const error = ref<string>('');
const message = ref<string>('');
const isRequestingDataDeletion = ref<boolean>(false);
const deletionReason = ref<string>('');

const activeTab = ref<'users' | 'requests' | 'reactivation'>('users');

const showCreateForm = ref<boolean>(false);
const newAccount = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
});

const actionMenuOpen = ref<string | null>(null);

const hasAccess = computed(() => {
  return currentUser.value && (currentUser.value.role === 'admin' || currentUser.value.role === 'superAdmin');
});

function toggleActionMenu(userId: string) {
  actionMenuOpen.value = actionMenuOpen.value === userId ? null : userId;
}

onMounted(() => {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      currentUser.value = JSON.parse(userJson);
    } catch (error) {
      console.error("Erreur lors du parsing de l'utilisateur", error);
    }
  }
  fetchUsers();
  fetchDeletionRequests();
  fetchReactivationRequests();
});

watch(activeTab, (tab) => {
  if (tab === 'reactivation') {
    fetchReactivationRequests();
  }
  if (tab === 'requests') {
    fetchDeletionRequests();
  }
  if (tab === 'users') {
    fetchUsers();
  }
});

watch(message, (val) => {
  if (val) {
    setTimeout(() => {
      message.value = '';
    }, 5000);
  }
});

watch(error, (val) => {
  if (val) {
    setTimeout(() => {
      error.value = '';
    }, 5000);
  }
});

async function fetchUsers() {
  try {
    const response = await api.get('/users');
    users.value = response.data;
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors du chargement des utilisateurs.";
  }
}

async function fetchDeletionRequests() {
  try {
    const response = await api.get('/users/deletion-requests');
    deletionRequests.value = response.data;
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors du chargement des demandes.";
  }
}

async function toggleSuspension(u: User) {
  try {
    const newStatus = !u.suspended;
    await api.put(`/users/${u.id}`, { suspended: newStatus });
    message.value = newStatus
      ? `Utilisateur ${u.email} suspendu.`
      : `Utilisateur ${u.email} réactivé.`;
    fetchUsers();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors de la mise à jour du statut.";
  }
}

async function deleteUser(u: User) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${u.email} ?`)) {
    return;
  }
  try {
    await api.delete(`/users/${u.id}`);
    message.value = `Utilisateur ${u.email} supprimé.`;
    fetchUsers();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors de la suppression de l'utilisateur.";
  }
}

async function toggleAdmin(u: User) {
  const newRole = u.role === 'admin' ? 'user' : 'admin';
  try {
    await api.put(`/users/${u.id}`, { role: newRole });
    message.value = `Le rôle de ${u.email} a été mis à jour en ${newRole}.`;
    fetchUsers();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors de la modification du rôle.";
  }
}

async function createAccount() {
  try {
    const response = await api.post('/users/register', {
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      password: newAccount.password,
    });
    message.value = "Compte créé avec succès.";
    newAccount.firstName = '';
    newAccount.lastName = '';
    newAccount.email = '';
    newAccount.password = '';
    showCreateForm.value = false;
    fetchUsers();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors de la création du compte.";
  }
}

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value;
}

function cancelDataDeletionRequest() {
  isRequestingDataDeletion.value = false;
  deletionReason.value = '';
}

async function confirmDataDeletionRequest() {
  if (!deletionReason.value) {
    error.value = "Veuillez renseigner une raison.";
    return;
  }
  try {
    await api.post('/users/data-deletion-request', { reason: deletionReason.value });
    message.value = "Demande de suppression des données envoyée.";
    cancelDataDeletionRequest();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors de la demande.";
  }
}

function formatRole(role: string): string {
  if (!role) return '';
  if (role === 'superAdmin') {
    return 'Super Admin';
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatStatus(s: string): string {
  switch (s) {
    case 'En attente': return 'En attente';
    case 'Approuvée':  return 'Approuvée';
    case 'Rejetée':    return 'Rejetée';
    default:           return s;
  }
}

async function fetchReactivationRequests() {
  try {
    const response = await api.get('/reactivation-requests');
    reactivationRequests.value = response.data;
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors du chargement des demandes.";
  }
}

function toggleRequestMenu(requestId: string) {
  actionMenuOpen.value = actionMenuOpen.value === requestId ? null : requestId;
}

async function approveRequest(req: ReactivationRequest) {
  try {
    await api.put(`/reactivation-requests/${req.id}/approve`);
    message.value = `La demande de ${req.user.firstName} ${req.user.lastName} a été approuvée.`;
    fetchReactivationRequests();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors de l'approbation de la demande.";
  }
}

async function rejectRequest(req: ReactivationRequest) {
  const rejectionComment = prompt("Entrez une raison pour le refus :");
  if (!rejectionComment) return;
  try {
    await api.put(`/reactivation-requests/${req.id}/reject`, { rejectionComment });
    message.value = `La demande de ${req.user.firstName} ${req.user.lastName} a été refusée.`;
    fetchReactivationRequests();
  } catch (err: any) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur lors du refus de la demande.";
  }
}

function canManageUser(u: User): boolean {
  if (!currentUser.value) return false;

  if (currentUser.value.role === 'superAdmin') {
    return u.role !== 'superAdmin';
  }

  if (currentUser.value.role === 'admin') {
    return u.role === 'user';
  }

  return false;
}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  text-align: left;
}
</style>
