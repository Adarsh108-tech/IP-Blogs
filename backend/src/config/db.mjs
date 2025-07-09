import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or paste full URL here
  ssl: {
    rejectUnauthorized: false, // required for Supabase/Neon
  },
});

export default pool;