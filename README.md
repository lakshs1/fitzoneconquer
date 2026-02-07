FITZONE conquer this is a gamefied fitness territory based programme 
this repo is a mvp for the project made with chatgpt  indirectly with the agentic model lovable .


## How can I edit this code?

There are several ways of editing your application.


**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS



## Open map hosting setup (frontend + backend)

The map module now uses OpenStreetMap-style raster tiles and does not require Google Maps at runtime.

### 1) Fast start (frontend only)
Use public OSM tiles for development only:

```bash
VITE_OSM_TILE_BASE_URL=https://tile.openstreetmap.org
```

Add this in your `.env` file and run the app.

### 2) Production recommendation (host your own tile service)
For production, do not hammer the public OSM tile server. Host your own tile endpoint and point the frontend to it:

```bash
VITE_OSM_TILE_BASE_URL=https://maps.yourdomain.com/tiles
```

### 3) Backend architecture options
You can run either of these:

- **Managed map host (easy):** MapTiler, Stadia Maps, Jawg, etc. (still open-data based, easier ops).
- **Self-hosted tiles (full control):**
  - PostGIS + `openmaptiles` pipeline + `tileserver-gl` (vector/raster)
  - or `tegola`/`tilelive` style stack
  - or pre-rendered raster tiles in object storage + CDN

### 4) Minimal backend contract for this app
- Frontend requests tiles as: `/{z}/{x}/{y}.png`
- Backend should support caching headers and CDN edge caching.
- If you need auth/rate limiting, put a reverse proxy in front (`/tiles/:z/:x/:y.png`) and set `VITE_OSM_TILE_BASE_URL` to that proxy.

### 5) GPS and places
- GPS tracking is browser Geolocation API (frontend).
- Place ranking/search logic is currently app-side algorithmic ranking over your place dataset.
- If you want backend place search, expose `/api/places?lat=..&lng=..` and return nearby gyms/parks/trails; frontend can keep using existing ranking fields.
