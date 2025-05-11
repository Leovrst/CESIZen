# CESIZen Mobile

Application mobile développée avec Ionic Vue pour CESIZen, intégrée dans un mono-repo contenant le frontend (Vue.js), le backend (NestJS) et l’app mobile.

## Prérequis

* **Node.js** (v14 ou plus)
* **npm** (v6 ou plus)
* **Ionic CLI**

  ```bash
  npm install -g @ionic/cli
  ```

## Installation

1. **Installer les dépendances** pour tout le monorepo :
   *(optionnel si tu utilises npm workspaces ou pnpm)*

   ```bash
   npm install
   ```

2. **Installer les dépendances** spécifiques à l’app mobile :

   ```bash
   cd apps/mobile
   npm install
   ```

## Lancement en développement (navigateur)

Depuis `apps/mobile` :

```bash
npx ionic serve
```

* Accès via [http://localhost:8100](http://localhost:8100)
* Live-reload automatique à chaque sauvegarde
* Pour tester sur votre réseau local :

  ```bash
  npx ionic serve --external
  ```

## Structure du dossier

```
apps/mobile/
├── src/
│   ├── components/    # Composants Vue/Ionic
│   ├── views/         # Pages (ion-page)
│   ├── services/      # Appels API
│   └── App.vue
├── ionic.config.json  # Config Ionic
├── package.json       # Scripts et dépendances
└── vite.config.ts     # Configuration Vite + Ionic
```

## Liens utiles

* [Documentation Ionic Vue](https://ionicframework.com/docs/vue)
* [Guide Capacitor](https://capacitorjs.com/docs)
* [Vue 3](https://v3.vuejs.org)

---

2025 CESIZen Team