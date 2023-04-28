const express = require('express')
const router = express.Router()
var article = require('../article-db')

router.get('/detail/:id', (req, res, next) => {
    var data = {article: article.find(article => article.id === req.params.id)}
    res.render('detail', data)
})

module.exports = router