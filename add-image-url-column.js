require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function addImageUrlColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding image_url column to promo_pages table...');
    const result = await client.query(`
      ALTER TABLE promo_pages 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `);
    console.log('Column added successfully');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    client.release();
    pool.end();
  }
}

addImageUrlColumn();