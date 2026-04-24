import sql from './lib/neon.js';

async function setupDb() {
  try {
    console.log("Setting up notifications table...");
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("Notifications table created successfully.");
  } catch (err) {
    console.error("Error creating notifications table:", err);
  } finally {
    process.exit();
  }
}

setupDb();
