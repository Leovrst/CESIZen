<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard Admin</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment
          :value="activeTab"
          @ionChange="e => { if (e.detail.value) activeTab = e.detail.value as 'users' | 'requests' | 'reactivation'; }"
          class="ion-padding-horizontal"
        >
          <ion-segment-button value="users">
            <ion-label>Utilisateurs</ion-label>
          </ion-segment-button>
          <ion-segment-button value="requests">
            <ion-label>Suppression</ion-label>
          </ion-segment-button>
          <ion-segment-button value="reactivation">
            <ion-label>Réactivation</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="activeTab === 'users'">
        <ion-button expand="block" color="success" @click="toggleCreateForm" class="ion-margin-bottom">
          Créer un compte
        </ion-button>

        <ion-card v-if="showCreateForm" class="ion-margin-bottom">
          <ion-card-header>
            <ion-card-title>Créer un nouveau compte</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Prénom</ion-label>
              <ion-input v-model="newAccount.firstName" required />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Nom</ion-label>
              <ion-input v-model="newAccount.lastName" required />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input type="email" v-model="newAccount.email" required />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Mot de passe</ion-label>
              <ion-input type="password" v-model="newAccount.password" required />
            </ion-item>
            <ion-button expand="block" color="primary" @click="createAccount" class="ion-margin-top">
              Créer
            </ion-button>
            <ion-button expand="block" color="medium" @click="toggleCreateForm" class="ion-margin-top">
              Annuler
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-list>
          <ion-list-header>
            <ion-label>Liste des utilisateurs</ion-label>
          </ion-list-header>

          <ion-item-sliding v-for="u in users" :key="u.id">
            <ion-item>
              <ion-avatar slot="start">
                <ion-icon name="person-circle-outline" size="large" />
              </ion-avatar>
              <ion-label>
                <h2>{{ u.firstName }} {{ u.lastName }}</h2>
                <p>{{ u.email }}</p>
                <p class="chips">
                  <ion-chip>
                    <ion-label>{{ formatRole(u.role) }}</ion-label>
                  </ion-chip>
                  <ion-chip :color="u.suspended ? 'danger' : 'success'">
                    <ion-label>{{ u.suspended ? 'Suspendu' : 'Actif' }}</ion-label>
                  </ion-chip>
                </p>
                <p class="date">{{ formatDate(u.registeredAt) }}</p>
              </ion-label>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option
                v-if="canManageUser(u) && currentUser?.role==='superAdmin' && u.role!=='superAdmin' && !u.suspended"
                @click="toggleAdmin(u)"
              >
                {{ u.role==='admin' ? 'Retirer admin' : 'Rendre admin' }}
              </ion-item-option>
              <ion-item-option
                v-if="canManageUser(u) && u.role==='user' && !u.suspended"
                @click="toggleSuspension(u)"
              >
                Suspendre
              </ion-item-option>
              <ion-item-option
                v-if="canManageUser(u) && u.role==='user'"
                color="danger"
                @click="deleteUser(u)"
              >
                Supprimer
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <div v-if="activeTab === 'requests'">
        <ion-list>
          <ion-list-header>Demandes de suppression</ion-list-header>
          <ion-item v-for="req in deletionRequests" :key="req.id">
            <ion-label>
              <h2>#{{ req.id }} – Utilisateur {{ req.userId }}</h2>
              <p>{{ req.email }}</p>
              <p><em>{{ req.reason }}</em></p>
              <p class="date">{{ req.date }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <div v-if="activeTab === 'reactivation'">
        <ion-list>
          <ion-list-header>Demandes de réactivation</ion-list-header>

          <ion-item-sliding v-for="req in sortedReactivationRequests" :key="req.id">
            <ion-item>
              <ion-label>
                <h2>#{{ req.id }} – {{ req.user?.firstName }} {{ req.user?.lastName }}</h2>
                <p>{{ req.comment }}</p>
                <p class="date">{{ formatDate(req.createdAt) }}</p>
                <p>Status : <strong>{{ formatStatus(req.status) }}</strong></p>
              </ion-label>
            </ion-item>

            <ion-item-options side="end" v-if="req.status==='En attente' && req.user">
              <ion-item-option color="success" @click="approveRequest(req)">
                Accepter
              </ion-item-option>
              <ion-item-option color="danger" @click="rejectRequest(req)">
                Refuser
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <ion-text color="success" v-if="message" class="ion-padding-top">{{ message }}</ion-text>
      <ion-text color="danger" v-if="error" class="ion-padding-top">{{ error }}</ion-text>

      <div v-if="!hasAccess" class="ion-text-center ion-padding">
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas les autorisations nécessaires.</p>
        <ion-button @click="router.push('/')">Retour à l'accueil</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonList, IonListHeader,
  IonAvatar, IonIcon, IonChip,
  IonItemSliding, IonItemOptions, IonItemOption,
  IonText
} from '@ionic/vue';

interface User { id: string; firstName: string; lastName: string; email: string; role: string; suspended: boolean; registeredAt: string; }
interface DeletionRequest { id: number; userId: number; email: string; reason: string; date: string; }
interface ReactivationRequest { id: string; user: User; comment: string; createdAt: string; status: string; }

const router = useRouter();
const currentUser = ref<User | null>(null);
const users = ref<User[]>([]);
const deletionRequests = ref<DeletionRequest[]>([]);
const reactivationRequests = ref<ReactivationRequest[]>([]);
const activeTab = ref<'users' | 'requests' | 'reactivation'>('users');
const showCreateForm = ref(false);
const newAccount = reactive({ firstName: '', lastName: '', email: '', password: '' });
const message = ref('');
const error = ref('');
const userActionMenuOpen    = ref<string|null>(null);
const requestActionMenuOpen = ref<string|null>(null);

const hasAccess = computed(() =>
  currentUser.value?.role === 'admin' || currentUser.value?.role === 'superAdmin'
);

const sortedReactivationRequests = computed(() =>
  [...reactivationRequests.value].sort((a, b) => {
    if (a.status === 'En attente' && b.status !== 'En attente') return -1;
    if (a.status !== 'En attente' && b.status === 'En attente') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })
);

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value;
}

function canManageUser(u: User): boolean {
  if (!currentUser.value) return false;
  if (currentUser.value.role === 'superAdmin') return u.role !== 'superAdmin';
  if (currentUser.value.role === 'admin') return u.role === 'user';
  return false;
}

onMounted(() => {
  const stored = localStorage.getItem('user');
  if (stored) currentUser.value = JSON.parse(stored);
  fetchUsers();
  fetchDeletionRequests();
  fetchReactivationRequests();
});

watch(activeTab, tab => {
  if (tab === 'users') fetchUsers();
  if (tab === 'requests') fetchDeletionRequests();
  if (tab === 'reactivation') fetchReactivationRequests();
});

watch(message, val => {
  if (val) setTimeout(() => (message.value = ''), 5000);
});
watch(error, val => {
  if (val) setTimeout(() => (error.value = ''), 5000);
});

async function fetchUsers() {
  try { users.value = (await api.get('/users')).data; }
  catch (e: any) { error.value = e.response?.data?.message || 'Erreur chargement utilisateurs'; }
}

async function fetchDeletionRequests() {
  try { deletionRequests.value = (await api.get('/users/deletion-requests')).data; }
  catch (e: any) { error.value = e.response?.data?.message || 'Erreur chargement demandes'; }
}

async function fetchReactivationRequests() {
  try { reactivationRequests.value = (await api.get('/reactivation-requests')).data; }
  catch (e: any) { error.value = e.response?.data?.message || 'Erreur chargement réactivations'; }
}

async function createAccount() {
  try {
    await api.post('/users/register', { ...newAccount });
    message.value = 'Compte créé.';
    Object.assign(newAccount, { firstName: '', lastName: '', email: '', password: '' });
    showCreateForm.value = false;
    fetchUsers();
  } catch (e: any) { error.value = e.response?.data?.message || 'Erreur création compte'; }
}

async function toggleSuspension(u: User) {
  try {
    await api.put(`/users/${u.id}`, { suspended: !u.suspended });
    message.value = u.suspended ? 'Réactivé.' : 'Suspendu.';
    fetchUsers();
  } catch (e: any) { error.value = e.response?.data?.message || 'Erreur suspension'; }
}

async function deleteUser(u: User) {
  if (!confirm(`Supprimer ${u.email} ?`)) return;
  try { await api.delete(`/users/${u.id}`); message.value='Supprimé.'; fetchUsers(); }
  catch (e: any) { error.value = e.response?.data?.message || 'Erreur suppression'; }
}

async function toggleAdmin(u: User) {
  try {
    const role = u.role === 'admin' ? 'user' : 'admin';
    await api.put(`/users/${u.id}`, { role });
    message.value = `Rôle mis à jour en ${role}.`;
    fetchUsers();
  } catch (e: any) { error.value = e.response?.data?.message || 'Erreur rôle'; }
}

async function approveRequest(r: ReactivationRequest) {
  try { await api.put(`/reactivation-requests/${r.id}/approve`); message.value='Approuvée'; fetchReactivationRequests(); }
  catch (e: any) { error.value = e.response?.data?.message || 'Erreur approbation'; }
}

async function rejectRequest(r: ReactivationRequest) {
  const comment = prompt('Raison de refus :'); if (!comment) return;
  try { await api.put(`/reactivation-requests/${r.id}/reject`, { rejectionComment: comment }); message.value='Rejetée'; fetchReactivationRequests(); }
  catch (e: any) { error.value = e.response?.data?.message || 'Erreur refus'; }
}

function formatRole(role: string) {
  return role === 'superAdmin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatStatus(s: string) {
  return s;
}

function toggleActionMenu(userId: string) {
  userActionMenuOpen.value = userActionMenuOpen.value === userId ? null : userId;
}
function toggleRequestMenu(requestId: string) {
  requestActionMenuOpen.value = requestActionMenuOpen.value === requestId ? null : requestId;
}
</script>

<style scoped>
.chips ion-chip {
  margin-right: 4px;
}
.date {
  font-size: 0.85em;
  color: var(--ion-text-color-secondary);
}
</style>
