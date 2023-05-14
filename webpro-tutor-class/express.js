const express = require("express");
const app = express();

const pool = require("./config/database");
const { func } = require("joi");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 *  เริ่มทำข้อสอบได้ที่ใต้ข้อความนี้เลยครับ
 * !!! ไม่ต้องใส่ app.listen() ในไฟล์นี้นะครับ มันจะไป listen ที่ไฟล์ server.js เองครับ !!!
 * !!! ห้ามลบ module.exports = app; ออกนะครับ  ไม่งั้นระบบตรวจไม่ได้ครับ !!!
 */

app.post("/todo", async function (req, res) {
  console.log(req.body);
  const title = req.body.title || null;
  const description = req.body.description || null;
  const due_date = req.body.due_date || new Date();

  //ดักกรณีไม่ส่ง title หรือ description มา
  if (!title || title === "") {
    res.status(400).send({
      message: "ต้องกรอก title",
    });
  }
  if (!description || description === "") {
    res.status(400).send({
      message: "ต้องกรอก description",
    });
  }

  try {
    //query max order
    const [order, fields] = await pool.query(
      "SELECT MAX(`order`) as mxOrder FROM todo"
    );
    console.log("Max Order =", order[0].mxOrder);
    const maxOrder = order[0].mxOrder;
    
    //เพิ่ม ToDo ใหม่
    const [newTodo, fields1] = await pool.query(
      "INSERT INTO todo(title, description, due_date, `order`) VALUES(?, ?, ?, ?)",
      [title, description, due_date, maxOrder + 1]
    );

    //query todo ที่ insert ไปล่าสุดมาเป็น response
    const insertId = newTodo.insertId;
    const [rows, fields2] = await pool.query(
      " SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date  FROM todo WHERE id = ?",
      [insertId]
    );
    res
      .status(201)
      .send({ message: `สร้าง ToDo '${title}' สำเร็จ`, todo: rows[0] });
  } catch (err) {
    console.log(err);
  }
});

app.delete("/todo/:id", async function (req, res) {
  try {
    const deleteId = req.params.id;
    //เช็คว่ามี id ที่ต้องการลบมั้ย
    const [row, fields] = await pool.query(
      "SELECT COUNT(*) FROM todo WHERE id = ?",
      [deleteId]
    );
    if (row[0]["COUNT(*)"] == 0) {
      return res.status(404).json({
        message: "ไม่พบ ToDo ที่ต้องการลบ",
      });
    }

    //query title มาใช้ response
    const [title, fields1] = await pool.query(
      "SELECT title FROM todo WHERE id = ?",
      [deleteId]
    );

    //ลบ ToDo id
    const [del, fields2] = await pool.query("DELETE FROM todo WHERE id = ?", [
      deleteId,
    ]);
    res.status(200).send({
      message: `ลบ ToDo '${title[0].title}' สำเร็จ`,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/todo", async function (req, res) {
  try {
    //เก็บตัวแปร query
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;

    //ดักกรณีที่ไม่ส่ง query string มาให้
    if (!startDate || !endDate){
        const [rows, fields] = await pool.query("SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo")
        res.status(200).send(rows)
    }

    //query เลือกเฉพาะช่วงวันที่ต้องการ
    const [row2, fields2] = await pool.query("SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo WHERE due_date BETWEEN ? AND ?", 
    [startDate, endDate])

    res.status(200).send(row2)

  } catch (err) {
    console.log(err)
  }
});

module.exports = app;
