<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Auto-diagnostic de stress</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-if="isAdmin && showConfigSection">
        <ion-card-header>
          <ion-card-title>Configuration du diagnostic</ion-card-title>
          <ion-button size="small" slot="end" @click="showConfigSection = false">
            Masquer
          </ion-button>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-list-header>Questions</ion-list-header>
            <ion-item v-for="(q, index) in questions" :key="q.id || index">
              <template v-if="editingQuestion === index">
                <ion-input
                  placeholder="Texte de la question"
                  v-model="q.label"
                  class="ion-margin-end"
                />
                <ion-input
                  type="number"
                  placeholder="Points"
                  v-model="q.points"
                  style="width:80px"
                />
                <ion-button
                  fill="outline"
                  color="success"
                  @click="saveQuestion(index)"
                >
                  Enregistrer
                </ion-button>
                <ion-button
                  fill="clear"
                  color="medium"
                  @click="cancelEditQuestion(index)"
                >
                  Annuler
                </ion-button>
              </template>
              <template v-else>
                <div style="flex:1">
                  {{ q.label }} <span style="color:grey">({{ q.points }} pts)</span>
                </div>
                <ion-button
                  fill="outline"
                  color="primary"
                  @click="editQuestion(index)"
                >
                  Éditer
                </ion-button>
                <ion-button
                  fill="clear"
                  color="danger"
                  @click="deleteQuestion(index)"
                >
                  Supprimer
                </ion-button>
              </template>
            </ion-item>
            <ion-button expand="block" color="success" @click="addQuestion">
              Ajouter une question
            </ion-button>
          </ion-list>

          <ion-list>
            <ion-list-header>Résultats</ion-list-header>
            <ion-item v-for="(r, index) in results" :key="r.id || index">
              <ion-grid>
                <template v-if="editingResult === index">
                  <ion-row>
                    <ion-col>
                      <ion-input
                        placeholder="Titre"
                        v-model="r.title"
                      />
                    </ion-col>
                    <ion-col>
                      <ion-input
                        type="number"
                        placeholder="Min"
                        v-model="r.minScore"
                      />
                    </ion-col>
                    <ion-col>
                      <ion-input
                        type="number"
                        placeholder="Max"
                        v-model="r.maxScore"
                      />
                    </ion-col>
                    <ion-col size="auto">
                      <ion-button
                        fill="outline"
                        color="success"
                        @click="saveResult(index)"
                      >
                        Enregistrer
                      </ion-button>
                      <ion-button
                        fill="clear"
                        color="medium"
                        @click="cancelEditResult(index)"
                      >
                        Annuler
                      </ion-button>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <ion-textarea
                        placeholder="Description du résultat"
                        v-model="r.message"
                        :rows="2"
                      />
                    </ion-col>
                  </ion-row>
                </template>
                <template v-else>
                  <ion-row>
                    <ion-col>
                      <strong>{{ r.title }}</strong>
                      <span style="color:grey">({{ r.minScore }}-{{ r.maxScore }})</span>
                    </ion-col>
                    <ion-col>
                      <ion-button
                        fill="outline"
                        color="primary"
                        @click="editResult(index)"
                      >
                        Éditer
                      </ion-button>
                      <ion-button
                        fill="clear"
                        color="danger"
                        @click="deleteResult(index)"
                      >
                        Supprimer
                      </ion-button>
                    </ion-col>
                  </ion-row>
                  <ion-row>
                    <ion-col>
                      <em>{{ r.message }}</em>
                    </ion-col>
                  </ion-row>
                </template>
              </ion-grid>
            </ion-item>
            <ion-button expand="block" color="success" @click="addResult">
              Ajouter un résultat
            </ion-button>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-button
        expand="block"
        color="primary"
        v-if="isAdmin && !showConfigSection"
        @click="showConfigSection = true"
        class="ion-margin-bottom"
      >
        Configurer le diagnostic
      </ion-button>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Questionnaire</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div v-if="evaluation">
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ evaluation.title }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>Score : {{ scoreFromServer }}</p>
                <p>{{ evaluation.message }}</p>
              </ion-card-content>
            </ion-card>
            <ion-button
              expand="block"
              color="warning"
              v-if="currentUser"
              @click="resetTest"
            >
              Repasser le test
            </ion-button>
          </div>

          <div v-else>
            <div v-if="!isComplete">
              <p>Question {{ currentIndex + 1 }} / {{ sortedQuestions.length }}</p>
              <p class="ion-margin-top"><strong>{{ currentQuestion.label }}</strong></p>
              <ion-button expand="block" color="success" @click="answer(true)">
                Oui
              </ion-button>
              <ion-button
                expand="block"
                color="danger"
                @click="answer(false)"
                class="ion-margin-top"
              >
                Non
              </ion-button>
            </div>
            <div v-else>
              <p>Vous avez terminé toutes les questions.</p>
              <ion-button expand="block" color="primary" @click="evaluate">
                Afficher le résultat
              </ion-button>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-text color="danger" v-if="error" class="ion-padding-top">
        {{ error }}
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonInput, IonList, IonListHeader, IonGrid,
  IonRow, IonCol, IonTextarea, IonText
} from '@ionic/vue';

interface DiagnosticQuestion { id?: string; label: string; points: number; }
interface DiagnosticResult   { id?: string; title: string; minScore: number; maxScore: number; message: string; }

const questions = ref<DiagnosticQuestion[]>([]);
const originalQuestions = ref<DiagnosticQuestion[]>([]);
const results   = ref<DiagnosticResult[]>([]);
const originalResults = ref<DiagnosticResult[]>([]);
const selected  = reactive<Record<string, boolean>>({});
const currentIndex    = ref(0);
const evaluation      = ref<DiagnosticResult | null>(null);
const scoreFromServer = ref(0);
const showConfigSection = ref(false);
const error             = ref('');
const message           = ref('');

const editingQuestion = ref<number | null>(null);
const editingResult   = ref<number | null>(null);

const userJson    = localStorage.getItem('user');
const currentUser = userJson ? JSON.parse(userJson) : null;
const isAdmin     = computed(() => currentUser?.role === 'admin' || currentUser?.role === 'superAdmin');

const sortedQuestions = computed(() => [...questions.value].sort((a, b) => a.points - b.points));
const currentQuestion = computed(() => sortedQuestions.value[currentIndex.value]);
const isComplete      = computed(() => currentIndex.value >= sortedQuestions.value.length);

const userStr = localStorage.getItem('user');
console.log(userStr ? JSON.parse(userStr) : null);

async function fetchData() {
  try {
    const [qRes, rRes] = await Promise.all([
      api.get<DiagnosticQuestion[]>('/diagnostic/questions'),
      api.get<DiagnosticResult[]>('/diagnostic/results-config'),
    ]);
    questions.value = qRes.data.map(q => ({ ...q }));
    originalQuestions.value = qRes.data.map(q => ({ ...q }));
    results.value   = rRes.data.map(r => ({ ...r }));
    originalResults.value = rRes.data.map(r => ({ ...r }));

    sortedQuestions.value.forEach(q => (selected[q.id!] = false));
    currentIndex.value = 0;
    evaluation.value   = null;
    scoreFromServer.value = 0;

    if (currentUser) {
      const resp = await api.get('/diagnostic/user-result');
      scoreFromServer.value = resp.data.score;
      evaluation.value      = resp.data.result;
      currentIndex.value    = sortedQuestions.value.length;
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur de chargement.';
  }
}

onMounted(fetchData);

watch(message, val => {
  if (val) setTimeout(() => (message.value = ''), 5000);
});
watch(error, val => {
  if (val) setTimeout(() => (error.value = ''), 5000);
});

function answer(value: boolean) {
  selected[currentQuestion.value.id!] = value;
  currentIndex.value++;
}

async function evaluate() {
  try {
    const sum = sortedQuestions.value.reduce((acc, q) => acc + (selected[q.id!] ? q.points : 0), 0);
    const resp = await api.get('/diagnostic/evaluate', { params: { score: sum } });
    scoreFromServer.value = resp.data.score;
    evaluation.value      = resp.data.result;
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur lors de l\'évaluation.';
  }
}

async function resetTest() {
  if (currentUser) {
    await api.delete('/diagnostic/user-result');
  }
  sortedQuestions.value.forEach(q => (selected[q.id!] = false));
  currentIndex.value = 0;
  evaluation.value   = null;
  scoreFromServer.value = 0;
}

function editQuestion(index: number) {
  editingQuestion.value = index;
  originalQuestions.value[index] = { ...questions.value[index] };
}
function cancelEditQuestion(index: number) {
  questions.value[index] = { ...originalQuestions.value[index] };
  editingQuestion.value = null;
}
function addQuestion() {
  questions.value.push({ label: '', points: 0 });
  originalQuestions.value.push({ label: '', points: 0 });
  editingQuestion.value = questions.value.length - 1;
}
async function saveQuestion(i: number) {
  const q = questions.value[i];
  try {
    if (q.id) {
      await api.patch(`/diagnostic/admin/questions/${q.id}`, { label: q.label, points: q.points });
    } else {
      const resp = await api.post('/diagnostic/admin/questions', { label: q.label, points: q.points });
      q.id = resp.data.id;
    }
    originalQuestions.value[i] = { ...q };
    editingQuestion.value = null;
  } catch (e: any) {
    alert(e.response?.data?.message || 'Erreur sauvegarde question.');
  }
}
async function deleteQuestion(i: number) {
  const q = questions.value[i];
  if (q.id) {
    try {
      await api.delete(`/diagnostic/admin/questions/${q.id}`);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur suppression question.');
      return;
    }
  }
  questions.value.splice(i, 1);
  originalQuestions.value.splice(i, 1);
  if (editingQuestion.value === i) editingQuestion.value = null;
}

function editResult(index: number) {
  editingResult.value = index;
  originalResults.value[index] = { ...results.value[index] };
}
function cancelEditResult(index: number) {
  results.value[index] = { ...originalResults.value[index] };
  editingResult.value = null;
}
function addResult() {
  results.value.push({ title: '', minScore: 0, maxScore: 0, message: '' });
  originalResults.value.push({ title: '', minScore: 0, maxScore: 0, message: '' });
  editingResult.value = results.value.length - 1;
}
async function saveResult(i: number) {
  const r = results.value[i];
  try {
    if (r.id) {
      await api.patch(`/diagnostic/admin/results/${r.id}`, {
        title: r.title,
        minScore: r.minScore,
        maxScore: r.maxScore,
        message: r.message,
      });
    } else {
      const resp = await api.post('/diagnostic/admin/results', {
        title: r.title,
        minScore: r.minScore,
        maxScore: r.maxScore,
        message: r.message,
      });
      r.id = resp.data.id;
    }
    originalResults.value[i] = { ...r };
    editingResult.value = null;
    await fetchData();
  } catch (e: any) {
    alert(e.response?.data?.message || 'Erreur sauvegarde résultat.');
  }
}

async function deleteResult(i: number) {
  const r = results.value[i];
  if (r.id) {
    try {
      await api.delete(`/diagnostic/admin/results/${r.id}`);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur suppression résultat.');
      return;
    }
  }
  results.value.splice(i, 1);
  originalResults.value.splice(i, 1);
  if (editingResult.value === i) editingResult.value = null;
}
</script>
