import os
from contextlib import closing

try:
    import psycopg2
    import psycopg2.extras
except ImportError:  # Allows the UI to run before dependencies are installed.
    psycopg2 = None

from flask import Flask, flash, redirect, render_template, request, url_for


app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-local-dev-key")


SERVICES = [
    {
        "icon": "fa-house-chimney",
        "title": "Residential Interior",
        "description": "Complete home interior solutions shaped around your lifestyle, storage needs, and daily comfort.",
    },
    {
        "icon": "fa-building",
        "title": "Commercial Interior",
        "description": "Refined commercial spaces that support productivity, brand identity, and a strong first impression.",
    },
    {
        "icon": "fa-couch",
        "title": "Living Room Design",
        "description": "Warm, balanced living rooms designed for hosting, relaxing, and everyday family life.",
    },
    {
        "icon": "fa-bed",
        "title": "Bedroom Design",
        "description": "Calm bedroom concepts with soft materials, careful lighting, and functional wardrobes.",
    },
    {
        "icon": "fa-briefcase",
        "title": "Office Interior",
        "description": "Ergonomic workspaces with clean zoning, better movement, and a polished professional feel.",
    },
]


PROJECTS = [
    {
        "title": "Modern Living Room",
        "location": "Mumbai, India",
        "tag": "Contemporary",
        "image": "images/modern-living-room.jpg",
    },
    {
        "title": "Luxury Bedroom",
        "location": "Delhi, India",
        "tag": "Luxury",
        "image": "images/luxury-bedroom.jpg",
    },
    {
        "title": "Office Workspace",
        "location": "Pune, India",
        "tag": "Corporate",
        "image": "images/office-workspace.jpg",
    },
    {
        "title": "Elegant Dining Area",
        "location": "Hyderabad, India",
        "tag": "Elegant",
        "image": "images/elegant-dining-area.jpg",
    },
    {
        "title": "Premium Villa Interior",
        "location": "Goa, India",
        "tag": "Premium",
        "image": "images/premium-villa-interior.jpg",
    },
]


TESTIMONIALS = [
    {
        "name": "Rajesh Sharma",
        "image": PROJECTS[0]["image"],
        "feedback": "The team transformed our living room exactly the way we imagined. Every finish feels premium and thoughtful.",
    },
    {
        "name": "Priya Patel",
        "image": PROJECTS[3]["image"],
        "feedback": "Professional, creative, and detail-oriented. Our office now feels sharp, open, and aligned with our brand.",
    },
    {
        "name": "Sunita Reddy",
        "image": PROJECTS[1]["image"],
        "feedback": "Our bedroom finally feels restful and elegant. The material selection was excellent.",
    },
]


BLOG_POSTS = [
    {
        "date": "June 15, 2026",
        "title": "Interior Trends 2026",
        "description": "Explore refined materials, quiet luxury, and warmer modern palettes for beautiful everyday spaces.",
        "image": PROJECTS[4]["image"],
    },
    {
        "date": "May 28, 2026",
        "title": "Best Living Room Colors",
        "description": "Choose elegant color combinations that make your living room feel welcoming and balanced.",
        "image": PROJECTS[0]["image"],
    },
]


def get_database_url():
    return os.environ.get("DATABASE_URL")


def get_connection():
    database_url = get_database_url()
    if not database_url or psycopg2 is None:
        return None
    return psycopg2.connect(database_url)


def init_db():
    conn = get_connection()
    if conn is None:
        return False
    try:
        with closing(conn):
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS contact_messages (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(120) NOT NULL,
                        email VARCHAR(180) NOT NULL,
                        subject VARCHAR(180),
                        message TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            conn.commit()
        return True
    except Exception:
        return False


def save_contact_message(name, email, subject, message):
    conn = get_connection()
    if conn is None:
        return False
    try:
        with closing(conn):
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO contact_messages (name, email, subject, message)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (name, email, subject, message),
                )
            conn.commit()
        return True
    except Exception:
        return False


@app.before_request
def ensure_database():
    if not getattr(app, "_db_checked", False):
        app._db_checked = True
        init_db()


@app.route("/")
def home():
    return render_template(
        "index.html",
        services=SERVICES,
        projects=PROJECTS,
        testimonials=TESTIMONIALS,
        blog_posts=BLOG_POSTS,
        db_enabled=bool(get_database_url() and psycopg2 is not None),
    )


@app.post("/contact")
def contact():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    subject = request.form.get("subject", "").strip()
    message = request.form.get("message", "").strip()

    if not name or not email or not message:
        flash("Please fill name, email, and message.", "error")
        return redirect(url_for("home") + "#contact")

    saved = save_contact_message(name, email, subject, message)
    if saved:
        flash("Message sent successfully. We will contact you soon.", "success")
    else:
        flash("Message received locally. Configure PostgreSQL to store submissions.", "info")

    return redirect(url_for("home") + "#contact")


@app.get("/health")
def health():
    conn = get_connection()
    if conn is None:
        return {"status": "ok", "database": "not_configured"}
    with closing(conn):
        return {"status": "ok", "database": "configured"}


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        debug=os.environ.get("FLASK_DEBUG", "0") == "1",
        port=int(os.environ.get("PORT", 5002)),
        use_reloader=False,
    )
