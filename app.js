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
// Team rule: give res.render() named values only, for example
//   res.render('edit', { note: req.body.note })
// and never a whole object from the user, such as req.body or req.query.
// hbs reads its own settings from that same object, so a visitor could
// otherwise change how a page is built.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// parse application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// When a route answers with JSON, indent it so that people can read it.
app.set('json spaces', 2);

/* ---------- Art Institute of Chicago API settings ---------- */

// Base address of the museum's public API. No key or account is needed.
const API_BASE = 'https://api.artic.edu/api/v1';

// The museum asks each app to identify itself with this courtesy header.
const API_HEADERS = {
  'AIC-User-Agent': 'art-institute-gallery-notebook (https://github.com/rbhat727/CSPT342_Web_Application)'
};

// A search returns very few fields unless we name the ones we want.
const SEARCH_FIELDS = 'id,title,artist_title,date_display,image_id,thumbnail';

// Fields we ask for when fetching one artwork for its own page.
const ARTWORK_FIELDS = 'id,title,artist_display,artist_title,date_display,medium_display,credit_line,image_id,thumbnail,is_on_view,gallery_title';

// The museum's own website, used to link to an artwork's official page.
const MUSEUM_SITE = 'https://www.artic.edu';

const RESULTS_PER_PAGE = 12;

// Widest image shown on an artwork page. The museum prefers this size.
const DETAIL_IMAGE_WIDTH = 843;

// Longest search we accept. The search box has the same limit.
const MAX_QUERY_LENGTH = 100;

// Base address for artwork images. Every API response includes the current
// value, so we update this whenever we hear from the API.
let iiifBase = 'https://www.artic.edu/iiif/2';

// Remember the image base address whenever a museum response includes one.
function rememberImageBase(result) {
  if (result.config && result.config.iiif_url) {
    iiifBase = result.config.iiif_url;
  }
}

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
// The date is given in Chicago time wherever the server runs, so a note
// saved in the evening is not shown under the next day's date.
function formatDate(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T') + 'Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago'
  });
}

// Work out the size of the large image for one artwork: 843 pixels wide, or
// the original's width if that is smaller. The height keeps the same shape.
// Used by the artwork page and by the JSON route.
function detailImageSize(artwork) {
  const original = artwork.thumbnail || {};
  if (original.width && original.height) {
    const width = Math.min(DETAIL_IMAGE_WIDTH, original.width);
    const height = Math.round((width * original.height) / original.width);
    return { width, height };
  }
  return { width: DETAIL_IMAGE_WIDTH, height: null };
}

// An artwork id in an address must be a whole number of 1 to 9 digits.
function isValidArtworkId(id) {
  return /^[0-9]{1,9}$/.test(id);
}

// Fetch one artwork from the museum's API.
// Resolves with the artwork's data, or with null when the museum has no
// artwork with that id. Throws an error when the museum cannot be reached
// or answers with a failure, so the calling route can show a message.
async function fetchArtwork(id) {
  const params = new URLSearchParams({ fields: ARTWORK_FIELDS });

  const response = await fetch(`${API_BASE}/artworks/${id}?${params}`, {
    headers: API_HEADERS,
    signal: AbortSignal.timeout(10000)
  });

  // The museum answers 404 for an id it does not know.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Art Institute API answered with status ${response.status}`);
  }

  const result = await response.json();
  rememberImageBase(result);
  return result.data;
}

// Show the "Page not found" page. Used by several routes.
function renderNotFound(res) {
  res.status(404).render('404', { title: 'Page not found' });
}

/* ---------- Routes ---------- */

// Home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// Search the museum's collection.
// The search term arrives in the address, for example /search?q=monet
app.get('/search', async (req, res) => {
  // Accept the search term only as ordinary text, tidy it and cap its length.
  const typed = typeof req.query.q === 'string' ? req.query.q : '';
  const query = typed.trim().slice(0, MAX_QUERY_LENGTH);

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

    rememberImageBase(result);

    // Keep only what the page needs, under simple names.
    const artworks = result.data.map((artwork) => ({
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist_title || 'Artist unknown',
      date: artwork.date_display,
      imageUrl: buildImageUrl(artwork.image_id, 400),
      altText: (artwork.thumbnail && artwork.thumbnail.alt_text) || artwork.title
    }));

    // Say how many works matched, for example "Showing 12 of 155 works".
    const total = result.pagination ? result.pagination.total : null;
    let countText = '';
    if (Number.isInteger(total) && total > artworks.length) {
      countText = `Showing ${artworks.length} of ${total.toLocaleString('en-US')} works`;
    } else if (artworks.length === 1) {
      countText = '1 work found';
    } else if (artworks.length > 1) {
      countText = `${artworks.length} works found`;
    }

    res.render('search', {
      title: `Search: ${query}`,
      query,
      artworks,
      countText,
      noResults: artworks.length === 0
    });
  } catch (error) {
    // The API was unreachable, too slow, or returned an error.
    console.error('Search failed:', error.message);
    res.status(502).render('search', { title: 'Search', query, apiError: true });
  }
});

// Artwork page: one work from the museum, chosen by the id in the address.
// Example: /artwork/111628
app.get('/artwork/:id', async (req, res) => {
  const id = req.params.id;

  // Anything that is not a plain number cannot be an artwork.
  if (!isValidArtworkId(id)) {
    return renderNotFound(res);
  }

  let artwork;
  try {
    artwork = await fetchArtwork(id);
  } catch (error) {
    // The API was unreachable, too slow, or returned an error.
    console.error('Artwork lookup failed:', error.message);
    return res.status(502).render('artwork', { title: 'Artwork unavailable', apiError: true });
  }

  // The museum has no artwork with this id.
  if (!artwork) {
    return renderNotFound(res);
  }

  // Telling the browser the image's size in advance stops the page from
  // jumping when the image arrives.
  const imageSize = detailImageSize(artwork);
  const original = artwork.thumbnail || {};

  // Where the work is in the building, if it is on display.
  let onViewText = 'Not currently on view';
  if (artwork.is_on_view) {
    onViewText = artwork.gallery_title ? `On view in ${artwork.gallery_title}` : 'On view';
  }

  res.render('artwork', {
    title: artwork.title,
    artwork: {
      id: artwork.id,
      title: artwork.title,
      // The artist text can run over several lines (name, then nationality and dates).
      artistLines: (artwork.artist_display || 'Artist unknown').split('\n'),
      date: artwork.date_display,
      medium: artwork.medium_display,
      creditLine: artwork.credit_line,
      onViewText,
      imageUrl: buildImageUrl(artwork.image_id, imageSize.width),
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      altText: original.alt_text || artwork.title,
      museumUrl: `${MUSEUM_SITE}/artworks/${artwork.id}`
    }
  });
});

// Artwork data as JSON: the museum's record for one work, sent as data
// rather than as a page. Example: /api/artworks/111628
app.get('/api/artworks/:id', async (req, res) => {
  const id = req.params.id;

  // This route always answers in JSON, including when something is wrong.
  if (!isValidArtworkId(id)) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  let artwork;
  try {
    artwork = await fetchArtwork(id);
  } catch (error) {
    // The API was unreachable, too slow, or returned an error.
    console.error('Artwork lookup failed:', error.message);
    return res.status(502).json({ error: 'The museum is not responding. Please try again in a moment.' });
  }

  if (!artwork) {
    return res.status(404).json({ error: 'Artwork not found' });
  }

  // Send the museum's record as it arrived, with its own field names,
  // and add one field of ours: the address of the image (or null if none).
  artwork.image_url = artwork.image_id
    ? buildImageUrl(artwork.image_id, detailImageSize(artwork).width)
    : null;

  res.json(artwork);
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
     GET  /artwork/:id            one artwork from the API (built)
   Module B
     GET  /api/artworks/:id       return one artwork's API data as JSON (built)
   Module C
     POST /collection             save a note (uses db.createNote);
                                  also adds the Save form to the artwork page
   Module D
     GET  /collection/:id/edit    edit form for one note (uses db.getNoteById)
     POST /collection/:id/edit    update the note (uses db.updateNote)
   Module E
     POST /collection/:id/delete  delete the note (uses db.deleteNote)
   Add each route above the "Page not found" section. */

/* ---------- Page not found ---------- */

// Runs only when no route above matched. Keep this below every route.
app.use((req, res) => {
  renderNotFound(res);
});

/* ---------- Errors ---------- */

// Runs when a route fails, for example when the database cannot be read.
// The four parameters tell Express this is an error handler. Keep it last.
app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);

  // If part of a page has already been sent, we cannot start a new one.
  // Hand the problem to Express, which closes the connection.
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).render('error', { title: 'Something went wrong' });
});

/* ---------- Start the server ---------- */

app.listen(port, () => {
  console.log(`Gallery Notebook running at http://localhost:${port}`);
});
