import os
import chess.engine
import torch
import torch.nn as nn
import torch.optim as optim

# Path to Stockfish executable
STOCKFISH_PATH = r"C:\Users\ryang\OneDrive\Desktop\stockfish\stockfish-windows-x86-64-avx2.exe"

# Neural network for the chess bot
class ChessBot(nn.Module):
    def __init__(self):
        super(ChessBot, self).__init__()
        self.fc1 = nn.Linear(64, 128)  # Match input size to 64 squares
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 32)
        self.fc4 = nn.Linear(32, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.relu(self.fc3(x))
        x = torch.sigmoid(self.fc4(x))
        return x

# Connect to Stockfish
def connect_to_stockfish():
    if not os.path.exists(STOCKFISH_PATH):
        raise FileNotFoundError(f"Stockfish executable not found at {STOCKFISH_PATH}")
    return chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)

def train_bot(games, model, optimizer, criterion, num_epochs=10):
    engine = connect_to_stockfish()
    for epoch in range(num_epochs):
        total_loss = 0.0
        for game in games:
            board = chess.Board()
            print(f"Starting new game:\n{board}")
            for move in game:
                try:
                    board.push(chess.Move.from_uci(move))
                except Exception as e:
                    print(f"Error applying move {move} on board:\n{board}")
                    raise e  # Re-raise the exception to debug further

                # Evaluate the board state with Stockfish
                info = engine.analyse(board, chess.engine.Limit(depth=15))
                eval_score = info["score"].relative.score(mate_score=10000) or 0

                # Prepare input and target for training
                board_state = []
                for square in chess.SQUARES:
                    piece = board.piece_at(square)
                    if piece:
                        board_state.append(float(piece.piece_type))
                    else:
                        board_state.append(0.0)
                board_state = torch.tensor(board_state, dtype=torch.float32).unsqueeze(0)

                prediction = model(board_state)
                target = torch.tensor([eval_score / 100.0], dtype=torch.float32).unsqueeze(0)

                # Calculate loss and update model
                loss = criterion(prediction, target)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
        print(f"Epoch {epoch + 1}/{num_epochs}, Loss: {total_loss:.4f}")
    engine.quit()

# Example games in UCI
example_games = [
    ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6']
]

# Initialize model, optimizer, and loss function
model = ChessBot()
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.MSELoss()

# Train the bot
train_bot(example_games, model, optimizer, criterion)

# Save the model
torch.save(model.state_dict(), "chess_bot.pth")
print("Model saved successfully.")