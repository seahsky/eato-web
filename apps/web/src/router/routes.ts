import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Standalone routes (no tab layout)
  {
    path: '/login',
    name: 'login',
    component: () => import('../features/auth/views/LoginPage.vue'),
  },
  {
    path: '/profile-setup',
    name: 'profile-setup',
    component: () => import('../features/profile/views/ProfileSetupPage.vue'),
  },
  {
    path: '/notification-permission',
    name: 'notification-permission',
    component: () => import('../features/notifications/views/NotificationPermissionPage.vue'),
  },

  // Tabbed routes
  {
    path: '/',
    component: () => import('../layout/TabLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../features/dashboard/views/DashboardPage.vue'),
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('../features/food/views/SearchPage.vue'),
      },
      {
        path: 'add',
        name: 'add',
        component: () => import('../features/food/views/AddFoodPage.vue'),
      },
      {
        path: 'food/edit/:id',
        name: 'edit-food',
        component: () => import('../features/food/views/EditFoodPage.vue'),
        props: true,
      },
      {
        path: 'partner',
        name: 'partner',
        component: () => import('../features/partner/views/PartnerPage.vue'),
      },
      {
        path: 'partner/approvals',
        name: 'partner-approvals',
        component: () => import('../features/partner/views/ApprovalsPage.vue'),
      },
      {
        path: 'partner/submissions',
        name: 'partner-submissions',
        component: () => import('../features/partner/views/MySubmissionsPage.vue'),
      },
      {
        path: 'partner/weekly',
        name: 'partner-weekly',
        component: () => import('../features/partner/views/PartnerWeeklyPage.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('../features/profile/views/ProfilePage.vue'),
      },
      {
        path: 'notifications/settings',
        name: 'notification-settings',
        component: () => import('../features/notifications/views/NotificationSettingsPage.vue'),
      },
      // Recipe routes
      {
        path: 'recipes',
        name: 'recipes',
        component: () => import('../features/recipes/views/RecipeListPage.vue'),
      },
      {
        path: 'recipes/new',
        name: 'recipe-new',
        component: () => import('../features/recipes/views/RecipeFormPage.vue'),
      },
      {
        path: 'recipes/search',
        name: 'recipe-search',
        component: () => import('../features/recipes/views/RecipeSearchPage.vue'),
      },
      {
        path: 'recipes/:id',
        name: 'recipe-detail',
        component: () => import('../features/recipes/views/RecipeDetailPage.vue'),
        props: true,
      },
      {
        path: 'recipes/:id/edit',
        name: 'recipe-edit',
        component: () => import('../features/recipes/views/RecipeFormPage.vue'),
        props: true,
      },
      {
        path: 'recipes/:id/log',
        name: 'recipe-log',
        component: () => import('../features/recipes/views/RecipeLogPage.vue'),
        props: true,
      },
      // Gamification routes
      {
        path: 'badges',
        name: 'badges',
        component: () => import('../features/gamification/views/BadgeShowcasePage.vue'),
      },
      {
        path: 'streak',
        name: 'streak',
        component: () => import('../features/gamification/views/StreakDetailPage.vue'),
      },
      {
        path: 'theme',
        name: 'theme',
        component: () => import('../features/gamification/views/ThemeCustomizationPage.vue'),
      },
      {
        path: 'avatar-frame',
        name: 'avatar-frame',
        component: () => import('../features/gamification/views/AvatarFramePage.vue'),
      },
    ],
  },
]

export default routes
