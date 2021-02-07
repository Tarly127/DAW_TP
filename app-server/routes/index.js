
var express = require('express')
var router = express.Router()
var axios = require('axios')
const jwt = require('jsonwebtoken')

function verifyTokenIndex(req, res, next)
{
  var myToken = req.query.token || req.body.token || req.cookies.token
  if(myToken){
    jwt.verify(myToken, "V{8xV^Nb<<8w[}.", function(e, payload){
      if(e){
        res.status(401).jsonp({error: e})
      }
      else{
        req.user = {
          nome: payload.nome,
          email: payload.email,
          nivel: payload.nivel,
          filiacao: payload.filiacao
        }
        res.redirect('/users/home')
      }
    })
  }
  else{
    next()
  }
}


/* GET home page. */
router.get('/', verifyTokenIndex, function(req, res) {  
  res.render('autenticacao');
});


module.exports = router;