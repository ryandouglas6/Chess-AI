const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Enable CORS for all routes
app.use(cors());

// MySQL connection setup
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",       // Replace with your MySQL password if required
    database: "your_database_name"  // Replace with your actual database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Simple test route
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

// Example query route (replace with your table name)
app.get("/data", (req, res) => {
    const query = "SELECT * FROM your_table"; // Replace with your table name
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send("Error fetching data");
            throw err;
        }
        res.json(results);
    });
});

// Start the server
app.listen(8081, () => {
    console.log("Server is listening on port 8081");
});
