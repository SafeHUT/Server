import pg from 'pg';

const {Pool} = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect',() => {
    console.log("Succesfully conected to database...");
});

pool.on('error',(err) => {
    console.log("Unable to connect database",err)
    process.exit(-1);
});

export const query = (text, params) =>  pool.query(text,params);

export {pool};