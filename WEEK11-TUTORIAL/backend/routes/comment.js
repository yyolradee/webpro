const express = require("express");
const upload = require("../multer");
const pool = require("../config")
const router = express.Router();

// Get comment
router.get('/:blogId/comments', function(req, res, next){
});

// Create new comment
router.post(
    "/:blogId/comments",
    upload.single("comment_image"),
    async function (req, res, next) {
      const blogId = req.params.blogId;
      const file = req.file;
      const { comment } = req.body;
      console.log(req.body);
  
      const conn = await pool.getConnection();
      await conn.beginTransaction();
  
      try {
        const [rows, fields] = await pool.query(
          "INSERT INTO comments(blog_id, comment) VALUE (?, ?)",
          [blogId, comment]
        );
        if (file) {
          const commentId = rows.insertId;
          const [rows2, fields2] = await pool.query(
            "INSERT INTO images(blog_id, comment_id, file_path) VALUE (?, ?, ?)",
            [blogId, commentId, file.path.substr(6)]
          );
          conn.commit()
        }
      } catch (err) {
        await conn.rollback();
        return next(err);
      } finally {
        console.log("finally");
        conn.release();
      }
    }
  );

// Update comment
router.put('/comments/:commentId', function(req, res, next){
    return
});

// Delete comment
router.delete('/comments/:commentId', function(req, res, next){
    return
});

// Delete comment
router.put('/comments/addlike/:commentId', function(req, res, next){
    return
});


exports.router = router