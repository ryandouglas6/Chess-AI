# Function to validate user login data
def validate_login(data):
    if 'username' not in data or 'password' not in data:
        return False, "Username and password are required."
    if len(data['password']) < 6:
        return False, "Password must be at least 6 characters."
    return True, "Valid data."

# Function to format game result data
def format_game_result(data):
    required_fields = ['user_id', 'game_id', 'result']
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    return True, {
        "user_id": data['user_id'],
        "game_id": data['game_id'],
        "result": data['result']
    }

# Function to sanitize input data
def sanitize_input(data):
    # For now: stripping unnecessary spaces and converting to lowercase - will need to support invalid chars later
    sanitized_data = {key: value.strip().lower() if isinstance(value, str) else value for key, value in data.items()}
    return sanitized_data

# More helper functions to come...
def some_other_helper_function():
    pass
