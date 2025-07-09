import express from "express";
import pool from "../config/db.mjs";
import verifyToken from "../middleware/validateUser.mjs";
import multer from "multer";
import cloudinary from "../utils/cloudinary.mjs";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Max 10MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/", "video/", "application/pdf"];
    if (allowed.some((type) => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// GET all posts (with attachments)
router.get("/", async (req, res) => {
  try {
    const posts = await pool.query(`
      SELECT 
        posts.*, 
        users.name AS author_name,
        COALESCE(json_agg(attachments.*) FILTER (WHERE attachments.id IS NOT NULL), '[]') AS attachments
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN attachments ON posts.id = attachments.post_id
      GROUP BY posts.id, users.name
      ORDER BY posts.created_at DESC
    `);
    res.json(posts.rows);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch posts", error: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const posts = await pool.query(`
      SELECT 
        posts.id,
        posts.user_id,
        posts.title,
        posts.description,
        posts.content,
        posts.created_at,
        users.name AS author_name,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id', attachments.id,
              'url', attachments.url,
              'type', attachments.type
            )
          ) FILTER (WHERE attachments.id IS NOT NULL), '[]'
        ) AS attachments
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN attachments ON posts.id = attachments.post_id
      WHERE posts.user_id = $1
      GROUP BY posts.id, users.name
      ORDER BY posts.created_at DESC
    `, [userId]);

    res.json(posts.rows);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ msg: "Failed to fetch user posts", error: err.message });
  }
});




// GET single post (with attachments)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await pool.query(`
      SELECT 
        posts.*, 
        users.name AS author_name,
        COALESCE(json_agg(attachments.*) FILTER (WHERE attachments.id IS NOT NULL), '[]') AS attachments
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN attachments ON posts.id = attachments.post_id
      WHERE posts.id = $1
      GROUP BY posts.id, users.name
    `, [id]);

    if (!post.rows.length) return res.status(404).json({ msg: "Post not found" });

    res.json(post.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch post", error: err.message });
  }
});

router.post("/", verifyToken, upload.array("files", 5), async (req, res) => {
  const { title, description, content } = req.body;
  const userId = req.user.id;

  if (!title || !description || !content) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert blog post
    const postResult = await client.query(
      "INSERT INTO posts (user_id, title, description, content) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, title, description, content]
    );

    const postId = postResult.rows[0].id;

    // Upload attachments (if any)
    const attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          console.log("Uploading:", file.originalname, file.mimetype);

          const uploadRes = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                resource_type: "auto",
                folder: "ipblogs",
              },
              (error, result) => {
                if (error) {
                  console.error("Cloudinary upload error:", error);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
            stream.end(file.buffer);
          });

          attachments.push({
            url: uploadRes.secure_url,
            type: file.mimetype.startsWith("image")
              ? "image"
              : file.mimetype.startsWith("video")
              ? "video"
              : "pdf",
          });
        } catch (uploadErr) {
          console.error("Error uploading file to Cloudinary:", uploadErr);
          throw new Error("File upload failed");
        }
      }

      // Insert attachments using parameterized query
      const insertAttachmentQuery = `
        INSERT INTO attachments (post_id, url, type) VALUES 
        ${attachments.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(", ")}
      `;

      const values = [postId];
      attachments.forEach((att) => {
        values.push(att.url, att.type);
      });

      await client.query(insertAttachmentQuery, values);
    }

    await client.query("COMMIT");

    res.status(201).json({
      ...postResult.rows[0],
      attachments,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Upload error:", err);
    res.status(500).json({
      msg: "Post creation failed",
      error: err.message,
      stack: err.stack,
    });
  } finally {
    client.release();
  }
});

// UPDATE post
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, content } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "UPDATE posts SET title=$1, description=$2, content=$3 WHERE id=$4 AND user_id=$5 RETURNING *",
      [title, description, content, id, userId]
    );

    if (!result.rowCount) return res.status(403).json({ msg: "Unauthorized or not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: "Update failed", error: err.message });
  }
});

// DELETE post
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM posts WHERE id=$1 AND user_id=$2 RETURNING *",
      [id, userId]
    );

    if (!result.rowCount) return res.status(403).json({ msg: "Unauthorized or not found" });

    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Delete failed", error: err.message });
  }
});

export default router;
