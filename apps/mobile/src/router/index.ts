import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import RegisterView from '@/views/RegisterView.vue';
import LoginView from '@/views/LoginView.vue';
import ProfileView from '@/views/ProfileView.vue';
import DiagnosticView from '@/views/DiagnosticView.vue';
import InformationListView from '@/views/InformationListView.vue';
import InformationDetailView from '@/views/InformationDetailView.vue';
import DashboardView from '@/views/DashboardView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView
  },
  {
    path: '/diagnostic',
    name: 'diagnostic',
    component: DiagnosticView
  },
  {
    path: '/informations',
    name: 'Informations',
    component: InformationListView
  },
  {
    path: '/informations/:slug',
    name: 'Informations-detail',
    component: InformationDetailView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAdmin: true },
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
