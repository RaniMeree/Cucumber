import sqlite3
import pandas as pd
import pymysql
from sqlalchemy import create_engine
import sys

try:
    # SQLite connection
    print("Connecting to SQLite...")
    SQLITE_DB_PATH = r"C:\Users\ranimeree\Desktop\APP\myapp\storeDB.db"
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    print("SQLite connection successful")

    # MySQL connection details
    MYSQL_USER = "root"  # or your MySQL username
    MYSQL_PASSWORD = "1r9a8n4i"  # your MySQL password
    MYSQL_HOST = "localhost"
    MYSQL_DATABASE = "storedb"  # your database name

    print("Connecting to MySQL...")
    # Create MySQL connection
    mysql_conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        charset='utf8mb4'
    )
    cursor = mysql_conn.cursor()
    print("MySQL connection successful")

    # Create database if it doesn't exist
    print(f"Creating database {MYSQL_DATABASE} if it doesn't exist...")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE}")
    cursor.execute(f"USE {MYSQL_DATABASE}")

    # Get all table names from SQLite
    print("Getting table names from SQLite...")
    tables_query = "SELECT name FROM sqlite_master WHERE type='table'"
    tables = pd.read_sql_query(tables_query, sqlite_conn)
    print(f"Found {len(tables)} tables")

    # Create SQLAlchemy engine for MySQL
    print("Creating SQLAlchemy engine...")
    mysql_engine = create_engine(
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DATABASE}?charset=utf8mb4"
    )

    # Migrate each table
    for table_name in tables['name']:
        try:
            print(f"\nStarting migration of table: {table_name}")
            
            # Read data from SQLite
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", sqlite_conn)
            print(f"Read {len(df)} rows from SQLite")
            
            # Write to MySQL
            df.to_sql(
                name=table_name,
                con=mysql_engine,
                if_exists='replace',
                index=False
            )
            print(f"Successfully migrated {len(df)} rows to table {table_name}")
            
        except Exception as e:
            print(f"Error migrating table {table_name}: {str(e)}")
            print(f"Error type: {type(e)}")
            continue

except Exception as e:
    print(f"Fatal error: {str(e)}")
    print(f"Error type: {type(e)}")
    sys.exit(1)

finally:
    print("\nClosing connections...")
    try:
        sqlite_conn.close()
        print("SQLite connection closed")
    except:
        pass
    
    try:
        mysql_conn.close()
        print("MySQL connection closed")
    except:
        pass

print("Migration completed!")