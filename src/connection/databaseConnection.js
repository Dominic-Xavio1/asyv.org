// import 'server-only';
import { Pool } from "pg";

const globalForPool = global;
export const pool = globalForPool.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,             
    idleTimeoutMillis: 30000, 
    connectionTimeoutMillis: 2000, 
    ssl: false
});

if (process.env.NODE_ENV !== "production") {
    globalForPool.pgPool = pool;
}

export default pool;
