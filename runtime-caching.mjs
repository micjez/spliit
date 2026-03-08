const oneDayInSeconds = 24 * 60 * 60
const sevenDaysInSeconds = 7 * oneDayInSeconds
const thirtyDaysInSeconds = 30 * oneDayInSeconds
const oneYearInSeconds = 365 * oneDayInSeconds

const runtimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-webfonts',
      expiration: {
        maxEntries: 8,
        maxAgeSeconds: oneYearInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'google-fonts-stylesheets',
      expiration: {
        maxEntries: 8,
        maxAgeSeconds: sevenDaysInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\/_next\/static\/.+/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-static-assets',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: thirtyDaysInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\/_next\/image\?url=.+$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-image-optimizer',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: oneDayInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:png|gif|jpg|jpeg|webp|svg|ico)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'static-image-assets',
      expiration: {
        maxEntries: 128,
        maxAgeSeconds: thirtyDaysInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:js|css)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'static-js-css-assets',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: thirtyDaysInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'static-font-assets',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: thirtyDaysInSeconds,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
    handler: 'NetworkOnly',
    method: 'GET',
  },
  {
    urlPattern: ({ request }) => request.destination === 'document',
    handler: 'NetworkOnly',
  },
]

export default runtimeCaching
