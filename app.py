from flask import Flask, request, jsonify, render_template, send_from_directory
from datetime import datetime
import os
import sqlite3
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)

app.static_folder = 'static'
UPLOAD_FOLDER = 'static/assets'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def init_db():
    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS destinations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                price REAL NOT NULL CHECK(price >= 0),
                image TEXT NOT NULL,
                last_updated TEXT NOT NULL
            )
        ''')
        conn.commit()

init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        return f"/static/assets/{unique_filename}"
    return None


@app.route('/')
@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/destinations')
def read():
    return render_template('read.html')


@app.route('/api/destinations', methods=['GET'])
def get_destinations():
    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, description, price, image, last_updated FROM destinations')
        destinations = cursor.fetchall()
    
    destinations_list = [{
        "id": row[0],
        "name": row[1],
        "description": row[2],
        "price": row[3],
        "image": row[4],
        "last_updated": row[5]
    } for row in destinations]

    return jsonify(destinations_list)

@app.route('/api/destinations/<int:id>', methods=['GET'])
def get_destination(id):
    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, description, price, image, last_updated FROM destinations WHERE id = ?', (id,))
        row = cursor.fetchone()
    
    if row:
        destination = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "price": row[3],
            "image": row[4],
            "last_updated": row[5]
        }
        return jsonify(destination)
    
    return jsonify({"error": "Напрямок не знайдено"}), 404

@app.route('/api/destinations', methods=['POST'])
def create_destination():
    data = request.json
    
    if not all(key in data for key in ["name", "description", "price"]):
        return jsonify({"error": "Відсутні необхідні поля"}), 400
    
    if "image" not in data or data["image"] == "":
        return jsonify({"error": "Фото не додано"}), 400

    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM destinations WHERE name = ?', (data["name"],))
        if cursor.fetchone():
            return jsonify({"error": "Оголошення з такою назвою вже існує. Будь ласка, введіть іншу назву."}), 400
    
    new_destination = {
        "name": data["name"],
        "description": data["description"],
        "price": float(data["price"]),
        "image": data["image"],
        "last_updated": datetime.now().strftime("%b %d %Y")
    }

    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO destinations (name, description, price, image, last_updated)
            VALUES (?, ?, ?, ?, ?)
        ''', (new_destination["name"], new_destination["description"], new_destination["price"], new_destination["image"], new_destination["last_updated"]))
        conn.commit()
        new_destination["id"] = cursor.lastrowid

    return jsonify(new_destination), 201


@app.route('/api/destinations/<int:id>', methods=['PUT'])
def update_destination(id):
    data = request.json

    if not all(key in data for key in ["name", "description", "price", "image"]):
        return jsonify({"error": "Відсутні необхідні поля"}), 400

    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM destinations WHERE id = ?', (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Напрямок не знайдено"}), 404

        cursor.execute('SELECT id FROM destinations WHERE name = ? AND id != ?', (data["name"], id))
        if cursor.fetchone():
            return jsonify({"error": "Оголошення з такою назвою вже існує"}), 400

        cursor.execute('''
            UPDATE destinations
            SET name = ?, description = ?, price = ?, image = ?, last_updated = ?
            WHERE id = ?
        ''', (data["name"], data["description"], float(data["price"]), data["image"], datetime.now().strftime("%b %d %Y"), id))
        conn.commit()

    updated_destination = {
        "id": id,
        "name": data["name"],
        "description": data["description"],
        "price": float(data["price"]),
        "image": data["image"],
        "last_updated": datetime.now().strftime("%b %d %Y")
    }

    return jsonify(updated_destination)

@app.route('/api/destinations/<int:id>', methods=['DELETE'])
def delete_destination(id):
    with sqlite3.connect('destinations.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM destinations WHERE id = ?', (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Напрямок не знайдено"}), 404
        
        cursor.execute('DELETE FROM destinations WHERE id = ?', (id,))
        conn.commit()
    
    return '', 204

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "Файл не знайдено"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Файл не обрано"}), 400
        
    file_path = save_image(file)
    if file_path:
        return jsonify({"image_url": file_path}), 201
    
    return jsonify({"error": "Недопустимий тип файлу"}), 400

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
