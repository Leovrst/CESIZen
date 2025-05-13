<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Auto-diagnostic de stress</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card v-if="showConfigSection">
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
              <ion-input
                placeholder="Texte de la question"
                v-model:value="q.label"
                class="ion-margin-end"
              />
              <ion-input
                type="number"
                placeholder="Points"
                v-model:value="q.points"
                style="width:80px"
              />
              <ion-button fill="clear" color="danger" @click="removeQuestion(index)">
                Supprimer
              </ion-button>
            </ion-item>
            <ion-button expand="block" color="success" @click="addQuestion">
              Ajouter une question
            </ion-button>
            <ion-button expand="block" color="primary" @click="saveQuestions">
              Enregistrer questions
            </ion-button>
          </ion-list>

          <ion-list>
            <ion-list-header>Résultats</ion-list-header>
            <ion-item v-for="(r, index) in results" :key="r.id || index">
              <ion-grid>
                <ion-row>
                  <ion-col>
                    <ion-input
                      placeholder="Titre"
                      v-model:value="r.title"
                    />
                  </ion-col>
                  <ion-col>
                    <ion-input
                      type="number"
                      placeholder="Min"
                      v-model:value="r.minScore"
                    />
                  </ion-col>
                  <ion-col>
                    <ion-input
                      type="number"
                      placeholder="Max"
                      v-model:value="r.maxScore"
                    />
                  </ion-col>
                  <ion-col size="auto">
                    <ion-button fill="clear" color="danger" @click="removeResult(index)">
                      Supprimer
                    </ion-button>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col>
                    <ion-textarea
                      placeholder="Description du résultat"
                      v-model:value="r.message"
                      rows="2"
                    />
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-item>
            <ion-button expand="block" color="success" @click="addResult">
              Ajouter un résultat
            </ion-button>
            <ion-button expand="block" color="primary" @click="saveResults">
              Enregistrer résultats
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
            <ion-button expand="block" color="warning" v-if="currentUser" @click="resetTest">
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
              <ion-button expand="block" color="danger" @click="answer(false)" class="ion-margin-top">
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
import { ref, reactive, computed, onMounted } from 'vue';
import api from '@/services/api';

interface DiagnosticQuestion { id: string; label: string; points: number; }
interface DiagnosticResult   { id: string; title: string; minScore: number; maxScore: number; message: string; }

const questions = ref<DiagnosticQuestion[]>([]);
const results   = ref<DiagnosticResult[]>([]);
const selected  = reactive<Record<string, boolean>>({});
const currentIndex    = ref(0);
const evaluation      = ref<DiagnosticResult | null>(null);
const scoreFromServer = ref(0);
const showConfigSection = ref(false);
const error             = ref('');

const userJson    = localStorage.getItem('user');
const currentUser = userJson ? JSON.parse(userJson) : null;
const isAdmin     = computed(() => currentUser?.role === 'admin' || currentUser?.role === 'superAdmin');

const sortedQuestions = computed(() => [...questions.value].sort((a, b) => a.points - b.points));
const currentQuestion = computed(() => sortedQuestions.value[currentIndex.value]);
const isComplete      = computed(() => currentIndex.value >= sortedQuestions.value.length);

async function fetchData() {
  try {
    const [qRes, rRes] = await Promise.all([
      api.get<DiagnosticQuestion[]>('/diagnostic/questions'),
      api.get<DiagnosticResult[]>('/diagnostic/results-config'),
    ]);
    questions.value = qRes.data;
    results.value   = rRes.data;
    sortedQuestions.value.forEach(q => (selected[q.id] = false));
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

function answer(value: boolean) {
  selected[currentQuestion.value.id] = value;
  currentIndex.value++;
}

async function evaluate() {
  try {
    const sum = sortedQuestions.value.reduce((acc, q) => acc + (selected[q.id] ? q.points : 0), 0);
    const resp = await api.get('/diagnostic/evaluate', { params: { score: sum } });
    scoreFromServer.value = resp.data.score;
    evaluation.value      = resp.data.result;
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur lors de l\u0027évaluation.';
  }
}

async function resetTest() {
  if (currentUser) {
    await api.delete('/diagnostic/user-result');
  }
  sortedQuestions.value.forEach(q => (selected[q.id] = false));
  currentIndex.value = 0;
  evaluation.value   = null;
  scoreFromServer.value = 0;
}

function addQuestion() { questions.value.push({ id: '', label: '', points: 0 }); }
function removeQuestion(i: number) { questions.value.splice(i, 1); }
async function saveQuestions() {
  try {
    await api.put('/diagnostic/admin/questions', { questions: questions.value });
    await fetchData();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur sauvegarde questions.';
  }
}
function addResult() { results.value.push({ id: '', title: '', minScore: 0, maxScore: 0, message: '' }); }
function removeResult(i: number) { results.value.splice(i, 1); }
async function saveResults() {
  try {
    await api.put('/diagnostic/admin/results', { results: results.value });
    await fetchData();
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Erreur sauvegarde résultats.';
  }
}

onMounted(fetchData);
</script>
