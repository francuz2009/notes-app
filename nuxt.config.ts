export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  typescript: { strict: true, typeCheck: true },

  css: ['~/assets/scss/main.scss'],

  devtools: { enabled: false },

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'Тестовое задания | Заметки',
      titleTemplate: '%s — Заметки',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          name: 'description',
          content:
            'SPA для заметок с todo-списками: undo/redo, черновики, оффлайн-хранилище.',
        },
        { name: 'theme-color', content: '#3b82f6' },
      ],
    },
  },
})
