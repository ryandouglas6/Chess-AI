from flask import Flask, request, jsonify
import pyodbc
from backend.utils.helpers import is_username_taken, is_email_taken, validate_password_strength, is_password_correct, generate_bot_id  # Adjusted import

# Database connection
def get_db_connection():
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=movemate.database.windows.net;"
        "DATABASE=movemate;"  
        "UID=movemate;"   
        "PWD=Castle4721$"
    )

app = Flask(__name__)

# Create an account
@app.route('/create-account', methods=['POST'])
def create_account():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    if is_username_taken(data['username'], cursor):
        return jsonify({"error": "Username is already taken."}), 400
    if is_email_taken(data['email'], cursor):
        return jsonify({"error": "Email is already registered."}), 400
    valid, message = validate_password_strength(data['password'])
    if not valid:
        return jsonify({"error": message}), 400

    cursor.execute("""
    INSERT INTO Users (username, firstname, lastname, email, password)
    VALUES (?, ?, ?, ?, ?)
    """, data['username'], data['firstname'], data['lastname'], data['email'], data['password'])
    conn.commit()
    conn.close()
    return jsonify({"message": "Account created successfully."}), 201

# User login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if username exists
    cursor.execute("SELECT username FROM Users WHERE username = ?", data['username'])
    user = cursor.fetchone()
    if not user:
        return jsonify({"error": "Username does not exist."}), 400

    # Check if password is correct
    if not is_password_correct(data['username'], data['password'], cursor):
        return jsonify({"error": "Incorrect password."}), 400

    conn.close()
    return jsonify({"message": "Login successful."}), 200

# Update user profile
@app.route('/update-profile', methods=['PUT'])
def update_profile():
    data = request.json
    user_id = data['id']
    conn = get_db_connection()
    cursor = conn.cursor()

    if 'email' in data and is_email_taken(data['email'], cursor):
        return jsonify({"error": "Email is already registered."}), 400
    if 'password' in data:
        if not is_password_correct(user_id, data['current_password'], cursor):
            return jsonify({"error": "Current password is incorrect."}), 400
        valid, message = validate_password_strength(data['password'])
        if not valid:
            return jsonify({"error": message}), 400
        cursor.execute("UPDATE Users SET password = ? WHERE id = ?", data['password'], user_id)

    for field in ['firstname', 'lastname', 'email']:
        if field in data:
            cursor.execute(f"UPDATE Users SET {field} = ? WHERE id = ?", data[field], user_id)

    conn.commit()
    conn.close()
    return jsonify({"message": "Profile updated successfully."}), 200

# Store game data
@app.route('/store-game', methods=['POST'])
def store_game():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO Games (player1ID, player2ID, game_data, created_at)
    VALUES (?, ?, ?, ?)
    """, data['player1ID'], data['player2ID'], data['game_data'], data['created_at'])
    conn.commit()
    conn.close()
    return jsonify({"message": "Game data stored successfully."}), 201

# Create a bot
@app.route('/create-bot', methods=['POST'])
def create_bot():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    bot_id = generate_bot_id(cursor)
    cursor.execute("""
    INSERT INTO Bots (bot_id, name)
    VALUES (?, ?)
    """, bot_id, data['name'])
    conn.commit()
    conn.close()
    return jsonify({"message": "Bot created successfully.", "bot_id": bot_id}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)