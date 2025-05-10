import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import ProfileView from '../views/ProfileView.vue';
import DiagnosticView from '@/views/DiagnosticView.vue';
import InformationListView from '../views/InformationListView.vue';
import InformationDetailView from '../views/InformationDetailView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/diagnostic',
    name: 'diagnostic',
    component: DiagnosticView,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/informations',
    name: 'info-list',
    component: InformationListView,
    meta: { requiresAuth: false }
  },
  {
    path: '/info/:slug',
    name: 'info-detail',
    component: InformationDetailView,
    meta: { requiresAuth: false }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register'];
  const authRequired = !publicPages.includes(to.path);
  const token = localStorage.getItem('token');
  if (authRequired && !token) {
    return next('/login');
  }
  next();
});

export default router;
