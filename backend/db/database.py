import pyodbc

# Establish the connection
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=movemate.database.windows.net;"
    "DATABASE=movemate;"  
    "UID=movemate;"   
    "PWD=Castle4721$"
)
cursor = conn.cursor()

# Step 1: Create a test table
cursor.execute("""
    CREATE TABLE TestTable (
        ID INT PRIMARY KEY,
        Name NVARCHAR(50),
        Age INT
    )
""")
conn.commit()

# Step 2: Insert mock data
cursor.execute("INSERT INTO TestTable (ID, Name, Age) VALUES (1, 'Alice', 25)")
conn.commit()

# Step 3: Modify the data
cursor.execute("UPDATE TestTable SET Age = 26 WHERE ID = 1")
conn.commit()

# Step 4: Retrieve and print the modified data
cursor.execute("SELECT * FROM TestTable WHERE ID = 1")
row = cursor.fetchone()
print(row)

# Step 5: Close the connection
conn.close()
