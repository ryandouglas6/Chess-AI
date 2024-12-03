from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS  # Enable CORS for frontend-backend communication
from backend.utils.helpers import (
    is_username_taken,
    is_email_taken,
    validate_password_strength,
    is_password_correct,
    generate_bot_id,
    sanitize_chess_notation
)

# Database connection
def get_db_connection():
    import pyodbc
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=movemate.database.windows.net;"
        "DATABASE=movemate;"
        "UID=movemate;"
        "PWD=Castle4721$"
    )

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Root route
@app.route('/', methods=['GET'])
def home():
    return "API is running!", 200

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

    cursor.execute(
        """
        INSERT INTO Users (username, firstname, lastname, email, password)
        VALUES (?, ?, ?, ?, ?)
        """,
        data['username'], data['firstname'], data['lastname'], data['email'], data['password']
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Account created successfully."}), 201

# User login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT username FROM Users WHERE username = ?", data['username'])
    user = cursor.fetchone()
    if not user:
        return jsonify({"error": "Username does not exist."}), 400

    if not is_password_correct(data['username'], data['password'], cursor):
        return jsonify({"error": "Incorrect password."}), 400

    conn.close()
    return jsonify({"message": "Login successful."}), 200

# Update user profile
@app.route('/update-profile', methods=['PUT'])
def update_profile():
    data = request.json
    user_id = data.get('id')  # Safely get 'id' from data
    if not user_id:
        return jsonify({"error": "User ID is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch current user data
    cursor.execute("SELECT email, username FROM Users WHERE id = ?", user_id)
    current_user = cursor.fetchone()
    if not current_user:
        conn.close()
        return jsonify({"error": "User not found."}), 404
    current_email, current_username = current_user

    # Check if email is being changed
    if 'email' in data and data['email'] != current_email:
        if is_email_taken(data['email'], cursor):
            conn.close()
            return jsonify({"error": "Email is already registered."}), 400

    # Check if password is being changed
    if 'password' in data:
        if not is_password_correct(current_username, data.get('current_password'), cursor):
            conn.close()
            return jsonify({"error": "Current password is incorrect."}), 400
        valid, message = validate_password_strength(data['password'])
        if not valid:
            conn.close()
            return jsonify({"error": message}), 400
        cursor.execute("UPDATE Users SET password = ? WHERE id = ?", data['password'], user_id)

    # Update other fields
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

    # Check if player1ID exists in Users
    cursor.execute("SELECT COUNT(*) FROM Users WHERE id = ?", data.get('player1ID'))
    if cursor.fetchone()[0] == 0:
        conn.close()
        return jsonify({"error": "Player 1 ID is not associated with a registered user."}), 400

    # Check if player2ID exists in Users
    cursor.execute("SELECT COUNT(*) FROM Users WHERE id = ?", data.get('player2ID'))
    if cursor.fetchone()[0] == 0:
        conn.close()
        return jsonify({"error": "Player 2 ID is not associated with a registered user."}), 400

    # Check if game_data is provided
    if not data.get('game_data'):
        conn.close()
        return jsonify({"error": "Game data is required."}), 400

    # Check if created_at is provided and in the correct format
    created_at = data.get('created_at')
    if not created_at:
        conn.close()
        return jsonify({"error": "Game creation time (created_at) is required."}), 400
    try:
        # Validate ISO 8601 datetime format
        from datetime import datetime
        datetime.fromisoformat(created_at)
    except ValueError:
        conn.close()
        return jsonify({"error": "Invalid date format for created_at. Use ISO 8601 format."}), 400

    # If all validations pass, store the game data
    cursor.execute(
        """
        INSERT INTO Games (player1ID, player2ID, game_data, created_at)
        VALUES (?, ?, ?, ?)
        """,
        data['player1ID'], data['player2ID'], data['game_data'], data['created_at']
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Game data stored successfully."}), 201


# Create a bot
@app.route('/create-bot', methods=['POST'])
def create_bot():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if the bot name already exists
    cursor.execute("SELECT name FROM Bots WHERE name = ?", data['name'])
    existing_bot = cursor.fetchone()
    if existing_bot:
        conn.close()
        return jsonify({"error": "A bot with this name already exists."}), 400

    # Generate a unique bot ID from helpers
    bot_id = generate_bot_id(cursor)

    # Set user_id (default to 0 if not provided)
    user_id = data.get('user_id', 0)

    # Insert the new bot into the database
    cursor.execute(
        """
        INSERT INTO Bots (bot_id, name, user_id)
        VALUES (?, ?, ?)
        """,
        bot_id, data['name'], user_id
    )
    conn.commit()
    conn.close()

    # Respond with the success message
    return jsonify({"message": f"Bot '{data['name']}' created successfully."}), 201

# Fetch game history for a user
@app.route('/fetch-game-history/<int:user_id>', methods=['GET'])
def fetch_game_history(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all games for the given user ID
    cursor.execute(
        """
        SELECT 
            g.game_data,
            g.created_at,
            CASE 
                WHEN g.player1ID = ? THEN (SELECT username FROM Users WHERE id = g.player2ID)
                WHEN g.player2ID = ? THEN (SELECT username FROM Users WHERE id = g.player1ID)
            END AS opponent_username
        FROM Games g
        WHERE g.player1ID = ? OR g.player2ID = ?
        """,
        user_id, user_id, user_id, user_id
    )

    games = cursor.fetchall()

    if not games:
        conn.close()
        return jsonify({"error": "No games found for this user."}), 404

    # Prepare the game history
    game_history = [
        {
            "game_data": game[0],
            "created_at": game[1],
            "opponent_username": game[2]
        }
        for game in games
    ]

    conn.close()
    return jsonify({"game_history": game_history}), 200

# Fetch bots for a specific user
@app.route('/fetch-bots/<int:user_id>', methods=['GET'])
def fetch_bots(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT bot_id, name FROM Bots WHERE user_id = ?", user_id)
    bots = cursor.fetchall()

    if not bots:
        conn.close()
        return jsonify({"error": "No bots found for this user."}), 404

    bot_list = [{"bot_id": bot[0], "name": bot[1]} for bot in bots]

    conn.close()
    return jsonify({"bots": bot_list}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)