import sqlite3
import os

DB_PATH = "lowkey.db"

def migrate():
    # Helper to check if column exists
    def column_exists(cursor, table, column):
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [info[1] for info in cursor.fetchall()]
            return column in columns
        except Exception:
            return False

    if not os.path.exists(DB_PATH):
        print("Database not found, skipping migration (will be created by app).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Starting migration...")

        # 1. Update access_requests
        print("Migrating access_requests...")
        if not column_exists(cursor, "access_requests", "status"):
            cursor.execute("ALTER TABLE access_requests ADD COLUMN status TEXT DEFAULT 'PENDING'")
        
        if not column_exists(cursor, "access_requests", "allowed_years"):
            # Store default as JSON list "[]"
            cursor.execute("ALTER TABLE access_requests ADD COLUMN allowed_years JSON DEFAULT '[]'")
            
        if not column_exists(cursor, "access_requests", "admin_comment"):
            cursor.execute("ALTER TABLE access_requests ADD COLUMN admin_comment TEXT")

        # 2. Update access_logs
        print("Migrating access_logs...")
        if not column_exists(cursor, "access_logs", "anonymized_token"):
             cursor.execute("ALTER TABLE access_logs ADD COLUMN anonymized_token TEXT")

        if not column_exists(cursor, "access_logs", "consented_attrs"):
             print("Adding consented_attrs to access_logs...")
             cursor.execute("ALTER TABLE access_logs ADD COLUMN consented_attrs JSON DEFAULT '{}'")

        # 3. Create approval_audits if not exists
        print("Creating approval_audits table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS approval_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER,
            admin_id INTEGER,
            action TEXT,
            comment TEXT,
            timestamp DATETIME,
            FOREIGN KEY(request_id) REFERENCES access_requests(id),
            FOREIGN KEY(admin_id) REFERENCES users(id)
        )
        """)

        # 4. Create user_audits if not exists
        print("Creating user_audits table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            target_user_id INTEGER,
            old_username TEXT,
            new_username TEXT,
            timestamp DATETIME,
            FOREIGN KEY(admin_id) REFERENCES users(id),
            FOREIGN KEY(target_user_id) REFERENCES users(id)
        )
        """)

        
        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
