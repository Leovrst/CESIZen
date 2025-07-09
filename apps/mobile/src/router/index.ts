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
import SupportView from '@/views/SupportView.vue';
import ForbiddenView from '@/views/ForbiddenView.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: HomeView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/profile', name: 'Profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/diagnostic', name: 'diagnostic', component: DiagnosticView, meta: { requiresAuth: true } },
  { path: '/informations', name: 'Informations', component: InformationListView },
  { path: '/informations/:slug', name: 'Informations-detail', component: InformationDetailView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAdmin: true } },
  { path: '/support', name: 'support', component: SupportView },
  { path: '/403', name: 'Forbidden', component: ForbiddenView }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user?.suspended && user.suspensionReason === 'BRUTE_FORCE') {
    if (to.path === '/support' || to.path === '/403' || to.path === '/login') return next();
    return next('/403');
  }

  if (to.meta.requiresAuth && !user) return next('/login');
  if (to.meta.requiresAdmin && (!user || (user.role !== 'admin' && user.role !== 'superAdmin'))) {
    return next('/home');
  }

  next();
});

export default router;
