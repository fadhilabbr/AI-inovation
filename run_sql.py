import psycopg2
import sys

DATABASE_URL = "postgresql://postgres:KIPskdgNEPcGyLjgQjMtbyEZPprIuSKS@maglev.proxy.rlwy.net:17135/railway"

def run_dump():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Reading dump.sql...")
        with open("dump.sql", "r", encoding="utf-8") as f:
            sql = f.read()
            
        print("Executing SQL...")
        cursor.execute(sql)
        
        cursor.close()
        conn.close()
        print("Successfully executed dump.sql!")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_dump()
