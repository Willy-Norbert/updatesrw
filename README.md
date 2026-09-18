# Updaterw

Updaterw is a technology publishing and community platform for AI updates, developer tools, programming tips, UI/UX notes, career stories, and useful software discoveries.

The application is a real full-stack product: React talks to an Express REST API, which stores data in local PostgreSQL through Prisma. There is no mock feed and no fake success handlers.

Brand colors taken from the existing logos in `public/`:

- Navy `#000020`
- Green `#00B860`
- Paper `#F8F8F8`

The existing `logo-light.png`, `logo-dark.png`, `loader-light.mp4`, and `loader-dark.mp4` assets are used in the UI.

## Technology stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Tiptap
- Backend: Node.js, Express, REST API
- Database: PostgreSQL + Prisma ORM
- Auth: bcrypt password hashing, JWT access tokens, rotating refresh tokens
- Uploads: Multer on the server, Cloudinary when credentials are set, local disk otherwise

## Folder structure

```
updatesRW/
  public/                 existing brand assets
  client/                 React + Vite app
  server/
    prisma/               schema + seed
    src/
      config/
      controllers/
      middleware/
      routes/
      services/
      utils/
      validators/
    uploads/              local media (images, videos, profiles)
```

## 1. PostgreSQL setup (Windows)

PostgreSQL 18 is expected to be running locally.

In PowerShell:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -c "CREATE DATABASE updaterw;"
```

Set `DATABASE_URL` in `server/.env` to your local user and password:

```
postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/updaterw?schema=public
```

## 2. Environment variables

Copy the example file:

```powershell
cd server
copy .env.example .env
```

Required variables:

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Local PostgreSQL connection |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `PORT` | API port, default `5000` |
| `CLIENT_URL` | Frontend origin, default `http://localhost:5173` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account |
| `CHIEF_EDITOR_EMAIL` / `CHIEF_EDITOR_PASSWORD` | Seeded editor account |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Optional Cloudinary storage |

Do not commit `server/.env`.

## 3. Install

From the project root:

```powershell
cd C:\Users\lenovo\Desktop\updatesRW
npm install
cd server
npm install
cd ..\client
npm install
```

## 4. Prisma migrate and seed

```powershell
cd C:\Users\lenovo\Desktop\updatesRW\server
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

Seed creates roles, categories, and hashtags. It does not fill the public feed with fake posts.

## 5. Run the app

Terminal 1 — API:

```powershell
cd C:\Users\lenovo\Desktop\updatesRW\server
npm run dev
```

Terminal 2 — frontend:

```powershell
cd C:\Users\lenovo\Desktop\updatesRW\client
npm run dev
```

Or from the root, after `npm install`:

```powershell
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000
- Health: http://localhost:5000/health

## 6. Default development accounts

These exist only after seed, using the values in `.env`:

| Role | Login | Default password if unchanged |
| --- | --- | --- |
| Admin | `admin@updaterw.local` | `Admin123!@#` |
| Chief Editor | `editor@updaterw.local` | `Editor123!@#` |
| Users | `willy`, `john`, `developer123`, `amina`, `marco` | `User123!@#` |

Change these before any real deployment.

## 7. Uploads

The browser never uploads directly to Cloudinary.

1. The client sends the file to `/api/uploads/image` or `/api/uploads/video`.
2. Multer validates MIME type, extension, and size.
3. If Cloudinary credentials are present, the server uploads the file and stores the secure URL.
4. If they are empty, the file is saved under `server/uploads/` and served at `/uploads/...`.

Directories:

- `server/uploads/images/`
- `server/uploads/videos/`
- `server/uploads/profiles/`

Limits default to 5 MB per image, 80 MB per video, 3 MB for profile photos.

## 8. Roles

- **USER** — register, profile, posts, media, hashtags, mentions, likes, comments, bookmarks, notifications, reports
- **CHIEF_EDITOR** — everything a user can do, plus edit/hide/feature posts, manage categories/hashtags, review reports, remove inappropriate comments
- **ADMIN** — full control, including user roles, deactivation, deleting any post/comment, platform stats, and `DELETE /api/admin/posts/:postId/likes/:userId`

Roles cannot be changed from the profile form. The backend enforces authorization.

## 9. Important API routes

Auth: `POST /api/auth/register` `POST /api/auth/login` `POST /api/auth/refresh` `POST /api/auth/logout` `GET /api/auth/me`

Posts: `GET /api/posts` `GET /api/posts/:id` `POST /api/posts` `PUT /api/posts/:id` `DELETE /api/posts/:id`

Social: `POST /api/posts/:id/like` `DELETE /api/posts/:id/like` `POST /api/posts/:id/comments` `POST /api/posts/:id/bookmark`

Uploads: `POST /api/uploads/image` `POST /api/uploads/video`

Discovery: `GET /api/search` `GET /api/hashtags/:name` `GET /api/categories`

Admin: `GET /api/admin/stats` `DELETE /api/admin/posts/:postId/likes/:userId`

Pagination uses `?page=1&limit=10`.

## 10. API smoke test

With the server running:

```powershell
cd C:\Users\lenovo\Desktop\updatesRW\server
npm run test:api
```

## Troubleshooting

- **Prisma cannot connect** — confirm PostgreSQL is running (`Get-Service postgresql*`) and `DATABASE_URL` uses `127.0.0.1`.
- **`psql` is not recognized** — call the full path under `C:\Program Files\PostgreSQL\18\bin\`.
- **Frontend cannot reach the API** — start the server on port 5000. Vite proxies `/api` and `/uploads`.
- **Uploads fail** — check file type (`jpg/png/webp` or `mp4/webm/mov`) and size limits.
- **Cloudinary errors** — leave the Cloudinary variables empty to use local disk, or fill all three values.
- **401 after login** — hard-refresh the browser so the stored access token is sent.
