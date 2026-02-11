import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { s3Storage } from '@payloadcms/storage-s3'


// import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
// import { Pages } from './collections/Pages'
// import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
// import { Footer } from './Footer/config'
// import { Header } from './Header/config'
// import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

// import { Media } from './payload/collections/media'
import { Dodatki } from './collections/dodatki'
import { Zasoby } from './collections/zasoby'
import { Rezerwacje } from './collections/rezerwacje'
import { Platnosci } from './collections/platnosci'
import { Blokady } from './collections/blokady'

import { UstawieniaStrony } from './globals/ustawienia-strony'
import { UstawieniaRezerwacji } from './globals/ustawienia-rezerwacji'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// console.log('CHECK imports', {
//   Media: !!Media,
//   Users: !!Users,
//   Dodatki: !!Dodatki,
//   Zasoby: !!Zasoby,
//   Rezerwacje: !!Rezerwacje,
//   Blokady: !!Blokady,
//   Platnosci: !!Platnosci,
//   UstawieniaStrony: !!UstawieniaStrony,
//   UstawieniaRezerwacji: !!UstawieniaRezerwacji,
//   defaultLexical: !!defaultLexical,
// })


export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      // beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      // beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  collections: [Media, Users, Dodatki, Zasoby, Rezerwacje, Blokady, Platnosci],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [UstawieniaStrony, UstawieniaRezerwacji],
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },

      bucket: process.env.S3_BUCKET!,

      config: {
        region: process.env.S3_REGION!,
        endpoint: process.env.S3_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },

        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      },
    }),
  ],

  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
