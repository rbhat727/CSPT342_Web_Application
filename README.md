# The Art Institute of Chicago Gallery Notebook

## Team

**Team name:** Chicago Art Scribers

**Members:** Daniel R., Yvonne Flores-Garcia, Riddik Bhat

## Application Name
The Art Institute of Chicago Gallery Notebook

## Application Description

Ever leave a museum full of wonderful thoughts, only to struggle to remember them later? The Art Institute of Chicago Gallery Notebook app helps you capture what catches your eye and what you think about it — right there in the gallery.

Start on the Home page, where you’ll find a featured artwork. From there, head to Search to find a specific piece in the Art Institute of Chicago’s collection, or visit the Explore by Style page. Select an artwork to open its Artwork Detail page, where you can view a large image and learn about the artist, date, medium, and credit line. As you explore, save the work to My Notebook with a note while your impressions are fresh. When you’re back home, open My Notebook to revisit the works you saved and the notes you made in the gallery. It’s an easy way to hold on to the details, impressions, and ideas you gathered during your museum visit.

## Need and Purpose

A museum visit can spark ideas, but those thoughts are easy to lose once you leave. The Art Institute’s website lets visitors explore its collection, but offers no way to preserve personal reflections. General note-taking apps, meanwhile, often lack the images and details that make each artwork memorable. The Gallery Notebook brings it all together, helping visitors remember which artworks caught their attention — and why.

## Target Audience

Our target audience is museum visitors who want their trips to the Art Institute to be more personal and memorable. We especially have in mind fellow Loyola students in the fine arts and humanities who need to track works for coursework, along with repeat visitors and members who want to keep a running record of what they've seen.

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

1. **Fast discovery:** Let visitors find works in the Art Institute's collection in seconds by keyword or by artistic style, without leaving the app.
2. **An enduring personal resource:** Give each user a notebook of saved works and notes that persists between visits and can be edited or pruned at any time.
3. **Clear and accessible layout:** Show artwork images and information within a dynamic format that works by keyboard and screen reader as well as by mouse, so the collection is open to everyone.

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

