# Home Designer Flask + PostgreSQL

Interior design landing page inspired by the reference site, rebuilt as a Python Flask app with a PostgreSQL-backed contact form.

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5002/`.

## PostgreSQL

Create a database, then set `DATABASE_URL` before starting the app:

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/home_designer"
python app.py
```

The app automatically creates the `contact_messages` table on first request. The same table definition is also available in `schema.sql`.

## Deploy Online

This repository supports two deployment modes:

- **Static front-end on Netlify** (recommended for a quick publish)
- **Full Flask app on Render/Heroku** (if you want Python + PostgreSQL backend)

### Deploy to Netlify

The root `index.html` is now a static site ready for Netlify. The contact form uses Netlify Forms, so no Flask server is required for the hosted website.

1. Push the repo to a Git provider.
2. Create a new site on Netlify.
3. Connect the repository.
4. Set the publish directory to `/`.
5. Leave build command blank.
6. Deploy.

Netlify will serve the static website directly from the root, and form submissions will be captured by Netlify Forms.

### Deploy the Python app elsewhere

If you want the Flask backend and PostgreSQL support, use Render or Heroku instead:

1. Push to your Git remote.
2. Set `SECRET_KEY` in environment variables.
3. Set `DATABASE_URL` if you want contact messages stored in PostgreSQL.

If you use Render, the service command is:

```bash
gunicorn app:app
```

If you use Heroku, the `Procfile` is already configured.

If no `DATABASE_URL` is set, the app still runs locally; contact submissions will not be stored in PostgreSQL.

## SEO and Site Health

- Added Open Graph and Twitter metadata for better social previews.
- Added `robots.txt` and `sitemap.xml` for search engine indexing.
- Added `.gitignore` to keep deployment artifacts and local dependencies out of source control.
