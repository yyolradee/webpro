# Summary

สร้าง db transaction
```javascript 
const conn = await pool.getConnection()
await conn.beginTransaction();
```
catch error
```javascript
await conn.rollback();
return next(error)
```

เพิ่ม ToDo ใหม่ ต้องใส่ title กับ description
```javascript
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
```
ลบ ToDo จาก id โดยต้องตรวจสอบก่อนว่ามี ToDo นั้นอยู่จริงมั้ย
```javascript
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
```

query String
```javascript
app.get("/todo", async function (req, res) {
  try {
    //เก็บตัวแปร query
    const startDate = req.query.start_date || '';
    const endDate = req.query.end_date || '';

    //ดักกรณีที่ไม่ส่ง query string มาให้
    
    let sql = "SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo"
    let condition = []

    //query เลือกเฉพาะช่วงวันที่ต้องการ
    
    if (startDate.lenght > 0 || endDate.lenght > 0){
      sql = "SELECT *, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date FROM todo WHERE due_date BETWEEN ? AND ?"
      condition = [startDate, endDate]
    }
    
    const [row2, fields2] = await pool.query(sql, condition)

    res.status(200).send(row2)

  } catch (err) {
    console.log(err)
  }
});
```
Joi Validate
```javascript

//สร้าง schema ในการ validate

const blogSchema = Joi.object({
  title: Joi.string().required().regex(/^[a-zA-Z]+$/).min(10).max(25),
  content: Joi.string().required().min(50),
  status: Joi.string().required().valid('status_private', 'status_public'),
  pinned: Joi.optional(),
  reference: Joi.string().uri(),
  start_date: Joi.allow(null).optional(),
  end_date: Joi.date().when('start_date', { is: Joi.exist(), then: Joi.required() }).min(Joi.ref('start_date'))
})

//นำ schema ไปใช้

  try {
    await blogSchema.validateAsync(req.body, { abortEarly: false });
  } catch (err) {
    console.log(err)
    return res.status(400).send(err);
  }
```

joi Validate กับข้อ Todo
```javascript
const schema = Joi.object({
      title: Joi.string().required().messages({
        'string.empty': 'ต้องกรอก title'
      }),
      description: Joi.string().required().messages({
        'string.empty': 'ต้องกรอก description'
      }),
      due_date: Joi.date().iso(),
    });
  
    const { value, error } = schema.validate(req.body);
  
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }
```

middleware เช็คว่าเป็นเจ้าของมั้ย
```javascript
const blogOwner = async (req, res, next) => {
  if (req.user.role == "admin") {
    return next();
  }

  const [[blog]] = await pool.query("SELECT * FROM blogs WHERE id=?", [
    req.params.id,
  ]);

  if (blog.create_by_id !== req.user.id) {
    return res
      .status(403)
      .send("You do not have permission to perform this action");
  }

  next();
};
```
