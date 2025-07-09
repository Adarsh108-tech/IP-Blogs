import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.mjs";
import authRoutes from "./routes/auth.mjs";
import postRoutes from "./routes/posts.mjs";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err.stack : res.rows[0]);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("IP Blogs Backend Running ✅");
});

app.listen(5000, () => console.log("Server running on port 5000"));
