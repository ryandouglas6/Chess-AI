import torch
import torch.nn as nn
import torch.optim as optim

# This class is where we define the chess bot's "brain"
# Each layer of neurons will perform transformations on the input data
# Multiple layers (to be developed further of course), should allow for more complex pattern abstraction
# The descending number of neurons in layers should simplify the decision-making process (need to look more into this)

class ChessBot(nn.Module):
    def __init__(self):
        super(ChessBot, self).__init__()
        # 1st Layer: takes input representing 64 chessboard squares and outputs 128 "neurons"
        self.fc1 = nn.Linear(64, 128)
        # 2nd layer: condenses 128 neurons to 64 neurons
        
        self.fc2 = nn.Linear(128, 64)
        # 3rd layer: narrows decision space to 32 neurons
        self.fc3 = nn.Linear(64, 32)
        # 4th layer: outputs 1 value (could represent a score for the move, this may be adjusted but for now is just 0 to 1)
        self.fc4 = nn.Linear(32, 1)

    # This function defines data flow through the layers
    def forward(self, x):
        # Passing the data through each layer with ReLU activation
        # ReLU (Rectified Linear Unit) helps the network learn complex patterns by removing negative values (setting them to 0)
        # This will likely be changed as we need to consider 'bad moves', but for now, a bot can be trained on only the good (faster training during testing)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.relu(self.fc3(x))
        # Sigmoid activation: squashes the output between 0 and 1 (a score for how good the move is)
        # Later, we will use StockFish or some other form of decision making with sigmoid to determine how "perfect" a move is. Likely won't be simply 0-1
        x = torch.sigmoid(self.fc4(x))
        return x

# Example test for now, just to test network
if __name__ == '__main__':
    model = ChessBot()  # Create an instance of the chess bot model
    print(model)  # Print network architecture

    # This is where we use random data (pretending it's a chessboard) to test the model
    example_input = torch.randn(1, 64)  # '1' means a single chessboard with 64 squares (each number represents a piece)
    output = model(example_input)  # Run the random data through the model to get a decision
    print(f"Output: {output}")  # Print the output of the network (in reality, this will be a move decision)


# Commented out future database functionality below:

# *** Placeholder for connecting to the database and pulling game data
# This will pull from the DB later once setup:

    # cursor.execute("SELECT * FROM GameTable WHERE game_id = 1")
    # game_data = cursor.fetchone()
        # We'll use game_data here (eventually automatically) to train the bot

# *** Placeholder for pushing trained bot data back into the database
# This will push trained bot's data to the DB later once setup:

    # cursor.execute("INSERT INTO BotTable (bot_id, performance_score) VALUES (?, ?)", (bot_id, performance_score))
    # conn.commit()
