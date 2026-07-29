import sqlite3
from datetime import datetime
import hashlib
import secrets

# ── 1. DB File Path ───────────────────────────────────────────────────────────
# This is the actual database file that gets created on disk
# Think of it like your entire database living in one file
DB_FILE = "finance.db"


# ── 2. get_db() ───────────────────────────────────────────────────────────────
def get_db():
    """
    Opens and returns a connection to the SQLite database.
    
    row_factory = sqlite3.Row allows us to access columns by name
    instead of index position.
    
    Example:
        row["category"]   ✅ works with row_factory
        row[2]            ✅ also works but less readable
    
    Called by every function that needs DB access.
    Always closed after use to prevent connection leaks.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


# ── 3. init_db() ──────────────────────────────────────────────────────────────
def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    TEXT    NOT NULL DEFAULT 'default',
            date       TEXT    NOT NULL,
            text       TEXT    NOT NULL,
            category   TEXT    NOT NULL,
            amount     REAL    NOT NULL,
            type       TEXT    NOT NULL,
            confidence REAL    NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL
        )
    """)
    # Attempt to add user_id column to existing DB
    try:
        conn.execute("ALTER TABLE transactions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'")
    except Exception:
        pass
    conn.commit()
    conn.close()
    print("✅ Database initialized → finance.db")

# ── 3.5 Auth Methods ──────────────────────────────────────────────────────────
def create_user(email: str, name: str, password: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if row:
        conn.close()
        return None # User exists
        
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    
    conn.execute(
        "INSERT INTO users (email, name, password_hash, salt) VALUES (?, ?, ?, ?)",
        (email, name, pwd_hash, salt)
    )
    conn.commit()
    conn.close()
    return {"email": email, "name": name}

def verify_user(email: str, password: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT name, password_hash, salt FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        return None
        
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), row["salt"].encode('utf-8'), 100000).hex()
    if pwd_hash == row["password_hash"]:
        return {"email": email, "name": row["name"]}
    return None
# ── 4. add_transaction() ──────────────────────────────────────────────────────
def add_transaction(user_id: str, text: str, category: str, amount: float, confidence: float) -> dict:
    conn    = get_db()
    tx_type = "income" if category == "Income" else "expense"
    date    = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor = conn.execute(
        """INSERT INTO transactions 
           (user_id, date, text, category, amount, type, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (user_id, date, text, category, amount, tx_type, confidence)
    )
    conn.commit()
    tx_id = cursor.lastrowid
    conn.close()

    return {
        "id":         tx_id,
        "user_id":    user_id,
        "date":       date,
        "text":       text,
        "category":   category,
        "amount":     amount,
        "type":       tx_type,
        "confidence": confidence
    }


# ── 5. get_all_transactions() ─────────────────────────────────────────────────
def get_all_transactions(user_id: str, limit: int = 50, offset: int = 0) -> list:
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM transactions 
           WHERE user_id = ?
           ORDER BY date DESC 
           LIMIT ? OFFSET ?""",
        (user_id, limit, offset)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ── 6. get_transaction_by_id() ────────────────────────────────────────────────
def get_transaction_by_id(user_id: str, tx_id: int) -> dict | None:
    conn = get_db()
    row  = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? AND id = ?", (user_id, tx_id)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# ── 7. update_transaction() ───────────────────────────────────────────────────
def update_transaction(user_id: str, tx_id: int, category: str) -> bool:
    conn = get_db()
    result = conn.execute(
        """UPDATE transactions 
           SET category = ?, type = ?
           WHERE user_id = ? AND id = ?""",
        (category, "income" if category == "Income" else "expense", user_id, tx_id)
    )
    conn.commit()
    conn.close()
    return result.rowcount > 0


# ── 8. delete_transaction() ───────────────────────────────────────────────────
def delete_transaction(user_id: str, tx_id: int) -> bool:
    conn = get_db()
    result = conn.execute(
        "DELETE FROM transactions WHERE user_id = ? AND id = ?", (user_id, tx_id)
    )
    conn.commit()
    conn.close()
    return result.rowcount > 0


# ── 9. has_income_transaction() ───────────────────────────────────────────────
def has_income_transaction(user_id: str) -> bool:
    conn = get_db()
    row  = conn.execute(
        "SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'income'", (user_id,)
    ).fetchone()
    conn.close()
    return row["count"] > 0


# ── 10. get_summary() ─────────────────────────────────────────────────────────
def get_summary(user_id: str) -> dict:
    conn = get_db()
    rows = conn.execute("SELECT * FROM transactions WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()

    income      = 0.0
    expense     = 0.0
    by_category = {}

    for r in rows:
        amt = r["amount"]
        cat = r["category"]
        by_category[cat] = round(by_category.get(cat, 0) + amt, 2)
        if r["type"] == "income":
            income  += amt
        else:
            expense += amt

    return {
        "total_income":      round(income, 2),
        "total_expense":     round(expense, 2),
        "balance":           round(income - expense, 2),
        "by_category":       by_category,
        "transaction_count": len(rows)
    }
if __name__ == "__main__":
    print("\n🧪 Testing database.py...\n")

    # 1. Init
    init_db()

    # 2. Add
    print("\n2. Adding test transactions...")
    t1 = add_transaction("paid 500 at swiggy",      "Food",      500.0,  0.94)
    t2 = add_transaction("uber ride to office",      "Transport", 250.0,  0.88)
    t3 = add_transaction("salary credited 45000",    "Income",    45000.0,0.97)
    print(f"   ✅ Added ID {t1['id']} → {t1['text']}")
    print(f"   ✅ Added ID {t2['id']} → {t2['text']}")
    print(f"   ✅ Added ID {t3['id']} → {t3['text']}")

    # 3. Fetch All
    print("\n3. Fetching all transactions...")
    txns = get_all_transactions()
    print(f"   ✅ Found {len(txns)} transactions")
    for t in txns:
        print(f"   [{t['id']}] {t['text']:<40} ₹{t['amount']} | {t['category']} | {t['type']}")

    # 4. Summary
    print("\n4. Summary...")
    s = get_summary()
    print(f"   ✅ Income:  ₹{s['total_income']}")
    print(f"   ✅ Expense: ₹{s['total_expense']}")
    print(f"   ✅ Balance: ₹{s['balance']}")
    print(f"   ✅ Count:   {s['transaction_count']}")

    # 5. Delete
    print(f"\n5. Deleting ID {t1['id']}...")
    print(f"   ✅ Deleted: {delete_transaction(t1['id'])}")

    print("\n6. Cleaning up test data...")
    import sqlite3
    conn = sqlite3.connect(DB_FILE)
    conn.execute("DELETE FROM transactions")
    conn.commit()
    conn.close()
    print("   ✅ Test data removed")

    print("\n✅ All tests passed!")
