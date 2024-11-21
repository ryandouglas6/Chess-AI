import re

# Validate if a username is unique
def is_username_taken(username, cursor):
    cursor.execute("SELECT username FROM Users WHERE username = ?", username)
    return cursor.fetchone() is not None

# Validate if an email is unique
def is_email_taken(email, cursor):
    cursor.execute("SELECT email FROM Users WHERE email = ?", email)
    return cursor.fetchone() is not None

# Validate password strength
def validate_password_strength(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, "Valid password."

# Check if the provided password matches the stored password for a given username
def is_password_correct(username, provided_password, cursor):
    cursor.execute("SELECT password FROM Users WHERE username = ?", username)
    stored_password = cursor.fetchone()
    if stored_password and stored_password[0] == provided_password:
        return True
    return False

# Sanitize chess notation data
def sanitize_chess_notation(game_data):
    # Validate format using basic regex or external logic later
    return game_data.strip()

# Generate a unique bot ID
def generate_bot_id(cursor):
    cursor.execute("SELECT COUNT(*) FROM Bots")
    count = cursor.fetchone()[0] + 1
    return f"bot{count}"