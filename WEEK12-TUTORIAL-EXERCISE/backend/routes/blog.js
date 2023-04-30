const express = require("express");
const path = require("path");
const pool = require("../config");
const fs = require("fs");
const multer = require("multer");
const { isLoggedIn, blogOwner } = require('../middlewares')
const Joi = require("joi");

router = express.Router();

// SET STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./static/uploads");
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage, limits: {fileSize: 1 * 1024 * 1024} });

router.put("/blogs/addlike/:id", async function (req, res, next) {
  const conn = await pool.getConnection();
  // Begin transaction
  await conn.beginTransaction();

  try {
    let [
      rows,
      fields,
    ] = await conn.query("SELECT `like` FROM `blogs` WHERE `id` = ?", [
      req.params.id,
    ]);
    let like = rows[0].like + 1;

    await conn.query("UPDATE `blogs` SET `like` = ? WHERE `id` = ?", [
      like,
      req.params.id,
    ]);

    await conn.commit();
    res.json({ like: like });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json(err);
  } finally {
    console.log("finally");
    conn.release();
  }
});

const blogSchema = Joi.object({
  title: Joi.string().required().regex(/^[a-zA-Z]+$/).min(10).max(25),
  content: Joi.string().required().min(50),
  status: Joi.string().required().valid('status_private', 'status_public'),
  pinned: Joi.optional(),
  reference: Joi.string().uri(),
  start_date: Joi.allow(null).optional(),
  end_date: Joi.date().when('start_date', { is: Joi.exist(), then: Joi.required() }).min(Joi.ref('start_date'))
})

router.post("/blogs", isLoggedIn, upload.array("myImage", 5), async function (req, res, next) {
  console.log("Request: POST to /blogs")

  console.log(req.body)
  console.log(req.files)
  const file = req.files;
  let pathArray = [];

  if (!file) {
    return res.status(400).json({ message: "Please upload a file" });
  }

  try {
    await blogSchema.validateAsync(req.body, { abortEarly: false });
  } catch (err) {
    console.log(err)
    return res.status(400).send(err);
  }

  const title = req.body.title;
  const content = req.body.content;
  const status = req.body.status;
  const pinned = req.body.pinned;
  const reference = req.body.reference || null;
  const start_date = req.body.start_date || null
  const end_date = req.body.end_date || null

  // Begin transaction
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    let results = await conn.query(
      "INSERT INTO blogs(title, content, status, pinned, `like`, create_date, create_by_id, start_date, end_date, reference) " +
      "VALUES(?, ?, ?, ?, 0, CURRENT_TIMESTAMP, ?, ?, ?, ?);",
      [title, content, status, pinned, req.user.id, start_date, end_date, reference]
    );
    const blogId = results[0].insertId;

    req.files.forEach((file, index) => {
      let path = [blogId, file.path.substring(6), index == 0 ? 1 : 0];
      pathArray.push(path);
    });

    await conn.query(
      "INSERT INTO images(blog_id, file_path, main) VALUES ?;",
      [pathArray]
    );

    await conn.commit();
    res.send("success!");
  } catch (err) {
    await conn.rollback();
    console.log(err)
    return res.status(400).json(err);
  } finally {
    conn.release();
  }
});

router.get("/blogs/:id", function (req, res, next) {
  // Query data from 3 tables
  const promise1 = pool.query("SELECT * FROM blogs WHERE id=?", [
    req.params.id,
  ]);
  const promise2 = pool.query("SELECT * FROM comments WHERE blog_id=?", [
    req.params.id,
  ]);
  const promise3 = pool.query("SELECT * FROM images WHERE blog_id=?", [
    req.params.id,
  ]);

  // Use Promise.all() to make sure that all queries are successful
  Promise.all([promise1, promise2, promise3])
    .then((results) => {
      const [blogs, blogFields] = results[0];
      const [comments, commentFields] = results[1];
      const [images, imageFields] = results[2];
      res.json({
        blog: blogs[0],
        images: images,
        comments: comments,
        error: null,
      });
    })
    .catch((err) => {
      return res.status(500).json(err);
    });
});

router.put("/blogs/:id", isLoggedIn, blogOwner, upload.array("myImage", 5), async function (req, res, next) {
  // Your code here
  const file = req.files;
  let pathArray = []

  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    next(error);
  }

  const title = req.body.title;
  const content = req.body.content;
  const status = req.body.status;
  const pinned = req.body.pinned;

  const conn = await pool.getConnection()
  await conn.beginTransaction();

  try {
    console.log(content)
    let results = await conn.query(
      "UPDATE blogs SET title=?, content=?, status=?, pinned=? WHERE id=?",
      [title, content, status, pinned, req.params.id]
    )

    if (file.length > 0) {
      file.forEach((file, index) => {
        let path = [req.params.id, file.path.substring(6), 0]
        pathArray.push(path)
      })

      await conn.query(
        "INSERT INTO images(blog_id, file_path, main) VALUES ?;",
        [pathArray])
    }

    await conn.commit()
    res.send("success!");
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    console.log('finally')
    conn.release();
  }
  return;
});

router.delete("/blogs/:id", isLoggedIn, blogOwner, async function (req, res, next) {
  // Your code here
  const conn = await pool.getConnection();
  // Begin transaction
  await conn.beginTransaction();

  try {
    // Check that there is no comments
    const [
      rows1,
      fields1,
    ] = await conn.query(
      "SELECT COUNT(*) FROM `comments` WHERE `blog_id` = ?",
      [req.params.id]
    );
    console.log(rows1);

    if (rows1[0]["COUNT(*)"] > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete blogs with comments" });
    }

    //Delete files from the upload folder
    const [
      images,
      imageFields,
    ] = await conn.query(
      "SELECT `file_path` FROM `images` WHERE `blog_id` = ?",
      [req.params.id]
    );
    const appDir = path.dirname(require.main.filename); // Get app root directory
    console.log(appDir)
    images.forEach((e) => {
      const p = path.join(appDir, 'static', e.file_path);
      fs.unlinkSync(p);
    });

    // Delete images
    await conn.query("DELETE FROM `images` WHERE `blog_id` = ?", [
      req.params.id,
    ]);
    // Delete the selected blog
    const [
      rows2,
      fields2,
    ] = await conn.query("DELETE FROM `blogs` WHERE `id` = ?", [
      req.params.id,
    ]);

    if (rows2.affectedRows === 1) {
      await conn.commit();
      res.status(204).send();
    } else {
      throw "Cannot delete the selected blog";
    }
  } catch (err) {
    console.log(err)
    await conn.rollback();
    return res.status(500).json(err);
  } finally {
    conn.release();
  }
});

exports.router = router;
