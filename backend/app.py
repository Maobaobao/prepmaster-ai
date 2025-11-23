import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from the root directory
basedir = os.path.abspath(os.path.dirname(__file__))
env_path = os.path.join(basedir, '..', '.env.local')

# Only load .env if it exists (does not override system env vars)
if os.path.exists(env_path):
    load_dotenv(env_path, override=False)

app = Flask(__name__, static_folder='../dist', static_url_path='/')
CORS(app)

# Database Configuration
db_url = os.getenv('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

print(f" * Database: {db_url.split('@')[-1] if '@' in db_url else db_url}") # Log DB (masked)

from .models import db
db.init_app(app)

from .routes import api
app.register_blueprint(api, url_prefix='/api')

with app.app_context():
    try:
        db.create_all()
        print(" * Database tables created/verified successfully")
    except Exception as e:
        print(f" * ERROR: Failed to connect to database!")
        print(f" * Error details: {str(e)}")
        print(f" * Please check your DATABASE_URL in .env.local")
        print(f" * Current DATABASE_URL: {db_url}")
        raise

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    file_name = path.split('/')[-1]
    dir_name = os.path.join(app.static_folder, '/'.join(path.split('/')[:-1]))
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    return {'status': 'healthy', 'message': 'Flask backend is running'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
