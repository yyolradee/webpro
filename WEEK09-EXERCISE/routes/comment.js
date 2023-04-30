const express = require("express");
const pool = require("../config");
const router = express.Router();

// Get comment
router.get('/:blogId/comments', function(req, res, next){
});

// Create new comment
router.post('/:blogId/comments', async function(req, res, next){
    const blogId = req.params.blogId
    const {
        comment,
        like,
        comment_by_id
    } = req.body
    const [rows, fields] = await pool.query(
        "INSERT INTO comments(blog_id, comment, comments.like, comment_by_id) VALUE (?, ?, ?, ?)",
        [blogId, comment, like, comment_by_id]
        )
        // console.log(rows)
    return res.json({
        "message":`A new comment is added (ID: ${rows.insertId} )` // แสดง ID ของ comment ที่เพิ่งถูก add
    })
});

// Update comment
router.put('/comments/:commentId',async function(req, res, next){
    const commentId = req.params.commentId
    const {
        comment,
        like,
        comment_date,
        comment_by_id,
        blog_id
    } = req.body
    
    const [rows, fields] = await pool.query(
        "UPDATE comments SET comment = ?, comments.like = ?, comment_date = ?, comment_by_id = ?, blog_id = ? WHERE id = ? ",
        [comment, like, comment_date, comment_by_id, blog_id, commentId ]
    )

    const [row2, fields2] = await pool.query(
        "SELECT * FROM comments WHERE id = ?",
        [commentId]
    )

    return res.json (
        {
            "message": `Comment ID ${commentId} is updated.`,
            "comment": row2[0] //ดึงข้อมูล comment ที่เพิ่งถูก update ออกมา และ return ใน response กลับไปด้วย
        }
    )
});

// Delete comment
router.delete('/comments/:commentId', async function(req, res, next){
    const commentId = req.params.commentId
    const [rows, fields] = await pool.query(
        "DELETE FROM comments WHERE id = ?",
        [commentId]
    )
    return res.json(
        {
            "message": `Comment ID ${commentId} is deleted.`
        }
    )
});

// addLike
router.put('/comments/addlike/:commentId', async function(req, res, next){
    const commentId = req.params.commentId
    const [rows, fields] = await pool.query(
        "SELECT * FROM comments WHERE id = ?",
        [commentId]
    )
    let likeCount = rows[0].like;
    likeCount += 1;

    const [row2, fields2] = await pool.query(
        "UPDATE comments SET comments.like = ? WHERE id = ?",
        [likeCount, commentId]
    )
    
    return res.json(
        {
            "blogId": rows[0].blog_id,
            "commentId": commentId,
            "likeNum": likeCount //5 คือจำนวน like ของ comment ที่มี id = 20 หลังจาก +1 like แล้ว
        }
    )
});


exports.router = router