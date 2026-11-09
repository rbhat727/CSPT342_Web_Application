# The Art Institute of Chicago Gallery Notebook

## Team

**Team name:** Chicago Art Scribers

**Members:** Daniel R., Yvonne Flores-Garcia, Riddik Bhat

## Application
The Art Institute of Chicago Gallery Notebook

## Application Description

## Need and Purpose

## Target Audience

## Pages and User Activities

| Page | Route | What users can do |
| --- | --- | --- |
| Home | `/` | Read a short introduction to the app, see a featured artwork from the collection, and navigate to Search, Explore by Style, or My Notebook |
| Search | `/search` | Enter a keyword (artist, title, subject) and browse matching works from the Art Institute's collection, shown with thumbnail, title, artist, and date |
| Explore by Style | `/styles` | Choose an art movement (Impressionism, Surrealism, Cubism, and others) and browse a gallery of works in that style; open any work's detail page |
| Artwork Detail | `/artwork/:id` | View a large image of one work with its artist, date, medium, and credit line; save the work to My Notebook with a personal note |
| My Notebook | `/collection` | See every saved work with its note and the date it was saved; open any work's detail page; edit or remove an entry |
| Edit Entry | `/collection/:id/edit` | Change the note or rating on a saved work, or cancel and return to My Notebook |

## Application Goals

1. **Fast discovery.** Let visitors find works in the Art Institute's collection in seconds by keyword or by artistic style, without leaving the app.
2. **A lasting personal record.** Give each user a notebook of saved works and notes that persists between visits and can be edited or pruned at any time.
3. **Clear and accessible presentation.** Show artwork images and information in a layout that works by keyboard and screen reader as well as by mouse, so the collection is open to everyone.

## Tools and Software

| Category | Tool |
| --- | --- |
| Editor | Visual Studio Code |
| Version control | Git and GitHub |
| Runtime | Node.js |
| Back-end framework | Express.js |
| Templating | Handlebars |
| Database | SQLite |
| External API | Art Institute of Chicago API (api.artic.edu) |
| API testing | Hoppscotch |
| Hosting | Heroku |

The Art Institute API requires no key; we will add the courtesy AIC-User-Agent header.

