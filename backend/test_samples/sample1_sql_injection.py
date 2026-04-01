# sample1_sql_injection.py
import sqlite3

def get_user(username):
    # DANGEROUS: String concatenation for SQL query
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    
    conn = sqlite3.connect('example.db')
    cursor = conn.cursor()
    cursor.execute(query) # Possible SQL Injection
    return cursor.fetchone()

password = "supersecretpassword123" # Hardcoded password
