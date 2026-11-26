// The Art Institute of Chicago Gallery Notebook
// Main application file: configuration, middleware and routes.

const path = require('path');
const express = require('express');

// Our own database functions (see database.js).
const db = require('./database');

const app = express();

// Use the port the host provides (Heroku sets PORT); fall back to 3000 locally.
const port = process.env.PORT || 3000;

/* ---------- Middleware and configuration ---------- */

// Static files (CSS, images) are served from the assets folder.
// Example: assets/css/styles.css is available at /css/styles.css
app.use(express.static(path.join(__dirname, 'assets')));

// View templating engine: Handlebars (hbs). Templates live in the views folder.
// views/layout.hbs is applied to every page automatically.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// parse application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

/* ---------- Art Institute of Chicago API settings ---------- */

// Base address of the museum's public API. No key or account is needed.
const API_BASE = 'https://api.artic.edu/api/v1';

// The museum asks each app to identify itself with this courtesy header.
const API_HEADERS = {
  'AIC-User-Agent': 'art-institute-gallery-notebook (https://github.com/rbhat727/CSPT342_Web_Application)'
};

// A search returns very few fields unless we name the ones we want.
const SEARCH_FIELDS = 'id,title,artist_title,date_display,image_id,thumbnail,is_public_domain';

const RESULTS_PER_PAGE = 12;

// Base address for artwork images. Every API response includes the current
// value, so we update this whenever we hear from the API.
let iiifBase = 'https://www.artic.edu/iiif/2';

// Build the address of an artwork image from its image_id.
// Artworks without an image get our placeholder instead.
function buildImageUrl(imageId, width) {
  if (!imageId) {
    return '/images/no-image.svg';
  }
  return `${iiifBase}/${imageId}/full/${width},/0/default.jpg`;
}

// Turn the database's timestamp ("2026-11-26 09:15:00", in UTC)
// into a readable date such as "November 26, 2026".
function formatDate(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T') + 'Z');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ---------- Routes ---------- */

// Home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// Search the museum's collection.
// The search term arrives in the address, for example /search?q=monet
app.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim();

  // No search term yet: show the empty form and do not call the API.
  if (!query) {
    return res.render('search', { title: 'Search' });
  }

  try {
    // "q" ranks artworks by relevance, but on its own it never returns an
    // empty list: when nothing matches, the museum's best-known works come
    // back instead. The second parameter keeps only artworks that really
    // contain the search words, so a search with no match returns nothing.
    const params = new URLSearchParams({
      q: query,
      'query[simple_query_string][query]': query,
      limit: RESULTS_PER_PAGE,
      fields: SEARCH_FIELDS
    });
    
    // Call the external REST API and wait for its answer (at most 10 seconds).
    const response = await fetch(`${API_BASE}/artworks/search?${params}`, {
      headers: API_HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Art Institute API answered with status ${response.status}`);
    }

    const result = await response.json();

    // Remember the image base address the API just gave us.
    iiifBase = result.config.iiif_url;

    // Keep only what the page needs, under simple names.
    const artworks = result.data.map((artwork) => ({
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist_title || 'Artist unknown',
      date: artwork.date_display,
      imageUrl: buildImageUrl(artwork.image_id, 400),
      altText: (artwork.thumbnail && artwork.thumbnail.alt_text) || artwork.title
    }));

    res.render('search', {
      title: `Search: ${query}`,
      query,
      artworks,
      noResults: artworks.length === 0
    });
  } catch (error) {
    // The API was unreachable, too slow, or returned an error.
    console.error('Search failed:', error.message);
    res.status(502).render('search', { title: 'Search', query, apiError: true });
  }
});

// My Notebook: list every saved note (the RETRIEVE part of CRUD).
app.get('/collection', async (req, res) => {
  const rows = await db.getAllNotes();

  // Prepare each database row for display.
  const notes = rows.map((row) => ({
    id: row.id,
    artworkId: row.artwork_id,
    title: row.title,
    artist: row.artist || 'Artist unknown',
    note: row.note,
    ratingText: row.rating ? `Rating: ${row.rating} of 5` : 'Not rated',
    savedOn: formatDate(row.created_at),
    imageUrl: buildImageUrl(row.image_id, 400),
    altText: `${row.title}, ${row.artist || 'artist unknown'}`
  }));

  res.render('notebook', { title: 'My Notebook', notes });
});

/* ---------- Route map (planned) ----------
   Kernel
     GET  /search                 search the Art Institute API, show results (built)
     GET  /collection             My Notebook: list saved notes (built)
   Module A
     GET  /artwork/:id            one artwork from the API, with a Save form
   Module B
     GET  /api/artworks/:id       return one artwork's API data as JSON
   Module C
     POST /collection             save a note (uses db.createNote)
   Module D
     GET  /collection/:id/edit    edit form for one note (uses db.getNoteById)
     POST /collection/:id/edit    update the note (uses db.updateNote)
   Module E
     POST /collection/:id/delete  delete the note (uses db.deleteNote)
   Add each route above the "Page not found" section. */

/* ---------- Page not found ---------- */

// Runs only when no route above matched. Keep this below every route.
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

/* ---------- Errors ---------- */

// Runs when a route fails, for example when the database cannot be read.
// The four parameters tell Express this is an error handler. Keep it last.
app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  res.status(err.status || 500).render('error', { title: 'Something went wrong' });
});

/* ---------- Start the server ---------- */

app.listen(port, () => {
  console.log(`Gallery Notebook running at http://localhost:${port}`);
});

