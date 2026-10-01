import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";
console.log("Process", process.env.DATABASE_URL);
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
