const dotenv = require("dotenv").config();
var express = require("express");
var router = express.Router();
const { Client } = require('pg');
const client = new Client({
    host: "dpg-cpcbb9v79t8c73c6qvo0-a.singapore-postgres.render.com",
    user: "nusmaps_user",
    password: process.env.POSTGRESPASS,// make sure to remove this
    database: "nusmaps",
    port:5432,
    ssl: {
        rejectUnauthorized: false, 
    },
    connectionTimeoutMillis: 5000, // 5 seconds
});
router.get("/busStops", async (req, res) => {
    await client.connect();
    try {
        const result = await client.query('SELECT * from busstops');
        return res.send(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error retrieving data. Check routing settings");
    } finally {
        await client.end();
    }
});
module.exports = router;

