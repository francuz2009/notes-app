import { fileURLToPath } from 'node:url'

const tokensPath = fileURLToPath(
  new URL('./app/assets/scss/_tokens.scss', import.meta.url)
).replace(/\\/g, '/')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,

  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  components: [{ path: '~/components', pathPrefix: false }],

  typescript: { strict: true, typeCheck: true },

  css: ['~/assets/scss/main.scss'],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${tokensPath}" as *;\n`,
        },
      },
    },
  },

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
      ],
    },
  },
})
