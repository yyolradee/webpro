const express = require("express");
const path = require("path");
const pool = require("../config");

router = express.Router();

// For tutorial 1
router.post("/blogs/addlike/:blogId", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM blogs WHERE id=?", [
      req.params.blogId,
    ]);
    let likeNum = rows[0].like;
    likeNum += 1;

    const [rows2, fields2] = await pool.query(
      "UPDATE blogs SET blogs.like=? WHERE blogs.id=?",
      [likeNum, req.params.blogId]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

// For tutorial 2
router.get("/blogs/search", async function (req, res, next) {
  // Your code here
});

// For inserting new blog
router.post("/create", async function (req, res, next) {
  // Your code here
});

// For blog detail page
router.get("/detail/:blogId", async function (req, res, next) {
  // Your code here
  const blogId = req.params.blogId;
  try {
    const [blogs, fields] = await pool.query(
      "SELECT * FROM blogs WHERE id = ?",
      [blogId]
    );

    const [comment, fields2] = await pool.query(
      "SELECT * FROM comments WHERE blog_id = ?",
      [blogId]
    )
    console.log(blogs)
    res.render("blogs/detail", { blog: blogs[0], comments: comment});
  } catch (err) {
    return next(err)
  }
});

// For updating blog
router.put("/update/:blogId", function (req, res) {
  // Your code here
});

// For deleting blog
router.delete("/delete/:id", function (req, res) {
  // Your code here
});

exports.router = router;
