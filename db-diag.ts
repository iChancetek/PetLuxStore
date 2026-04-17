import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, WebSocket: ws });
    try {
        const res = await pool.query('SELECT current_database(), current_user');
        console.log('CONNECTED successfully:', res.rows[0]);
        
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in public schema:', tables.rows.map(r => r.table_name));
    } catch (err) {
        console.error('CONNECTION FAILED:', err.message);
    } finally {
        await pool.end();
    }
})();
