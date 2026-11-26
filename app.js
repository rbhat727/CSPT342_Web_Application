// The Art Institute of Chicago Gallery Notebook
// Main application file: configuration, middleware and routes.

const path = require('path');
const express = require('express');

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

/* ---------- Routes ---------- */

// Home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

/* ---------- Route map (planned) ----------
   Kernel
     GET  /search                 search the Art Institute API, show results
     GET  /collection             My Notebook: list saved notes
   Module A
     GET  /artwork/:id            one artwork from the API, with a Save form
   Module B
     GET  /api/artworks/:id       return one artwork's API data as JSON
   Module C
     POST /collection             save a note
   Module D
     GET  /collection/:id/edit    edit form for one note
     POST /collection/:id/edit    update the note
   Module E
     POST /collection/:id/delete  delete the note
   Add each route above the "Page not found" section. */
   
/* ---------- Page not found ---------- */

// Runs only when no route above matched. Keep this below every route.
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

/* ---------- Start the server ---------- */

app.listen(port, () => {
  console.log(`Gallery Notebook running at http://localhost:${port}`);
});
