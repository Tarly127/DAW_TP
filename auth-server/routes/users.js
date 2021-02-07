var express = require('express');
var router = express.Router();
var passport = require('passport');
const jwt = require('jsonwebtoken');
const axios = require('axios')


var Utilizador = require('../controllers/utilizador')

/* Login */
router.post('/login', passport.authenticate('login'), function(req, res){
  jwt.sign({id: req.user._id, nivel: req.user.nivel, email: req.user.email,  nome: req.user.nome, filiacao: req.user.filiacao,
      sub: 'trabalho de daw'}, 
      "V{8xV^Nb<<8w[}.",
      {expiresIn: 3600 * 3},
      function(e,token){
        if(e) res.status(500).jsonp({error: "Erro na geração do token " + e})
        else res.status(201).jsonp({token: token})
      });
})

/* Registo */
router.post('/registar', passport.authenticate('registar'), function(req, res){
  jwt.sign({id: req.user._id, email: req.user.email, nivel: req.user.nivel, nome: req.user.nome, filiacao: req.user.filiacao,
      sub: 'trabalho de daw'}, 
      "V{8xV^Nb<<8w[}.",
      {expiresIn: 3600 * 3},
      function(e,token){
        if(e) res.status(500).jsonp({error: "Erro na geração do token " + e})
        else res.status(201).jsonp({token: token})
      });
})

/* Adicionar notifações */
router.post('/notificacao/nova', (req, res) => {
  var email = req.body.email
  var notificacao = {
    titulo: req.body.titulo,
    rec_id: req.body.rec_id,
    nome_pub: req.body.nome,
    data_pub: req.body.post_date
  }
  Utilizador.nova_notificacao(email, notificacao)
    .then(data => {
      res.status(200).jsonp(data)
    })
    .catch(err => {
      console.log("Erro na inserção")
      res.status(500).send("Erro na adição das notificações: " + err)
    })
})


/* Remover uma notificação */
router.post('/notificacao/apagar', (req,res) => {

  Utilizador.delete_notificacao(req.body.email, req.body.rec_id)
    .then(dados => {
      res.status(200).jsonp(dados)
    })
    .catch(err => {
      console.log("Unable to DELETE notification!")
      res.status(400).send("Error: " + err)
    })

})

router.get('/notificacoes', (req, res) => {
  Utilizador.consultar(req.query.email)
    .then(data => {      
      res.status(200).jsonp(data.notificacoes)
    })
    .catch(err => {
      res.status(500).send("Erro: " + err)
    })
})

/* Lista de utilizadores do sistema */
router.get('/', function(req, res){
  Utilizador.lista_utilizadores()
    .then(data => {
      res.status(200).jsonp(data)
    })
    .catch(erro => res.status(500).send('Erro na consulta da lista de utilizadores: ' + erro))

})


module.exports = router;