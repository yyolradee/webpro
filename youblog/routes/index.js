const express = require('express')
const router = express.Router()
var article = require('../article-db')

router.get('/', function(req, res, next) {
    var str = req.query.search || ''
    var data = { title: 'Express', article: article.filter(article => article.title.toLowerCase().includes(str.toLowerCase()))}
    res.render('index', data)
})

// router.get('/detail/:id', (req, res, next) => {
//     var data = {article: article.find(article => article.id === req.params.id)}
//     res.render('detail', data)
// })

module.exports = router