var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')

var multer = require('multer')
const fs = require('fs')
var upload = multer({dest: 'uploads/'})
var axios = require('axios')

function verifyToken(req, res, next)
{
  var myToken = req.query.token || req.body.token || req.cookies.token
  if(myToken){
    jwt.verify(myToken, "V{8xV^Nb<<8w[}.", function(e, payload){
      if(e){
        res.render('autenticacao')
      }
      else{
        req.user = {
          nome: payload.nome,
          email: payload.email,
          nivel: payload.nivel,
          filiacao: payload.filiacao
        }
        next()
      }
    })
  }
  else{
    //Token inexistente
    res.render('autenticacao')
  }
}

async function anos(token){
  var anos
  await axios.get('http://localhost:8001/recursos/anos?token=' + token)
    .then(dados => { anos = dados.data })
  for(var i in anos){
    anos[i] = new Date(anos[i]).getFullYear()
  }  
  var anosAux = anos.filter(function(elem, index, self){
    return index === self.indexOf(elem)
  })
  return anosAux
}

async function tipos(token){
  var tipos
  await axios.get('http://localhost:8001/recursos/tipos?token=' + token)
    .then(dados => { tipos = dados.data })
  var tiposAux = tipos.filter(function(elem, index, self){
    return index === self.indexOf(elem)
  })
  return tiposAux
}

/* Devolve a lista de estrelas */
async function valores_estrelas(opcao,token, user){
  var i = 0
  var recursos
  if(opcao == 1){
    await axios.get('http://localhost:8001/recursos/produzidos?token=' + token)
      .then( dados => { recursos = dados.data})
  }
  else if(opcao == 2){
    await axios.get('http://localhost:8001/recursos/publicos?token=' + token)
      .then( dados => { recursos = dados.data})
  }
  else{
    await axios.get('http://localhost:8001/recursos/sortAutor?token=' + token)
      .then( dados => { recursos = dados.data})
  }
  while(i < recursos.length){
    if(recursos[i].estrelas.length > 0){
      recursos[i] = recursos[i].estrelas.find(estrela => estrela.email_produtor === user.email)
      if(recursos[i])
        recursos[i]=recursos[i].valor
    }
    else{
      recursos[i] = 0
    }
    i++
  }
  return recursos  
}

async function fez_avaliacao(user,token, id){
  var recurso
  await axios.get('http://localhost:8001/recurso/' + id + '?token=' + token)
    .then(dados => {
      recurso = dados.data
    })
  var num = -1
  if(recurso.estrelas.length > 0){  
    num = recurso.estrelas.find(estrela => estrela.email_produtor === user.email)
    if(num != undefined){
      num = num.valor
    }
    else num = 0
  }
  else
  {
    num = 0
  }
  return num
}

function getNotificacoes(req, res, next){
  req.user.notificacoes = []
  axios.get('http://localhost:8002/utilizadores/notificacoes?email=' + req.user.email)
    .then(dados => {
      req.user.notificacoes = dados.data
      next()
    })
    .catch(err => {
      console.log("Não foi possível obter as notificações!")
      req.user.notificacoes = []
      next()
    })
}

/* POST de registo */
router.post('/registar', function(req, res) {
  axios.post('http://localhost:8002/utilizadores/registar', req.body)
    .then(dados => {
      res.cookie('token', dados.data.token, {
        expires: new Date(Date.now() + '3h'),
        secure: false, // set to true if your using https
        httpOnly: true
      })
      res.redirect('home')
    })
    .catch(e => res.render('error', {error: e}))
});

/* POST de login */
router.post('/login', function(req, res) {
  axios.post('http://localhost:8002/utilizadores/login', req.body)
    .then(dados => {
      res.cookie('token', dados.data.token, {
        expires: new Date(Date.now() + '3h'),
        secure: false, // set to true if your using https
        httpOnly: true
      })
      res.redirect('home')
    })
    .catch(e => res.render('error', {error: e}))
})

/* POST de logout (para mudar a cookie para uma que deixa de ser utilizável passado um milissegundo) */
router.post('/logout', verifyToken, (req,res) => {
  res.cookie('token', "", {
    expires: new Date(Date.now() + '1ms'),
    secure: false, // set to true if your using https
    httpOnly: true
  })
  res.redirect('/')
})

/* GET da homepage */
router.get('/home', verifyToken, getNotificacoes, async function(req, res){
  var anosAux = await anos(req.cookies.token)
  var tiposAux = await tipos(req.cookies.token)
  console.log(req.user)

  res.render('homepage', {user : req.user, tipos: tiposAux, anos: anosAux, notificacoes: req.user.notificacoes})
});

router.get('/recursos/com', verifyToken, getNotificacoes, function(req, res){
  var opcao = "barra"
  axios.get('http://localhost:8001/recursos/com/'+req.query.titulo+'?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, titulo: req.query.titulo, notificacoes: req.user.notificacoes})
    })
    .catch(e => res.render('error'))
})

/* POST de upload de recurso (NÃO DESALTERES POR FAVOR) */
router.post('/upload', verifyToken, upload.single('myFile'), async function(req, res){
  var anosAux = await anos(req.cookies.token)
  var tiposAux = await tipos(req.cookies.token)
  if(!req.file || !req.body.titulo || !req.body.tipo || req.body.privacidade == undefined || !tiposAux.includes(req.body.tipo))
  {
    console.log("Informação insuficiente!")
    res.render('error', {e : "Informação insuficiente!"}) /** NÃO ESTÁ A ENVIAR NENHUM OUTPUT PARA O USER, CONVºEM MUDAR ISSO */
  }
  else
  {
    let actual_path = __dirname.substr(0,__dirname.length - 7)

    let oldPath = actual_path + '/' + req.file.path
    let newPath = actual_path + '/public/fileStore/' + req.file.originalname

    fs.rename(oldPath, newPath, function(err) { 
      if(err) throw err
    })
    axios.post('http://localhost:8001/recurso/upload/' + req.file.originalname + '?token=' + req.cookies.token, req.body)
      .then(dados => {
        if(req.body.privacidade == 'false'){
          req.body.rec_id = dados.data._id
          req.body.email = req.user.email
          req.body.nome = req.user.nome
          req.body.post_date = new Date(Date.now()).toISOString().substr(0,16)
          axios.post('http://localhost:8002/utilizadores/notificacao/nova?email=' + req.user.email, req.body)
            .then(data => {
              console.log("Atualizei as notificações")
              res.render('sucesso', { msg : "Recurso adicionado com sucesso e os outros utilizadores serão notificados!" })
            })
            .catch(err => {
              console.log("Erro na inserção das notificações")
              res.render('sucesso', { msg : "Recurso adicionado com sucesso (mas os outros não serão notificados)!" })
            })
          }
          else
            res.render('sucesso', { msg : "Recurso adicionado com sucesso!" })
      })
      .catch(e =>{ 
        console.log("Erro no upload de um ficheiro")
        res.render('error', {error: e})
      })
    }
})

/* POST de download de recurso */
router.post('/download/:filename', verifyToken, (req, res) => {
  let actual_path = __dirname.substr(0,__dirname.length - 7)
  res.download(actual_path + '/public/fileStore/' + req.params.filename)
})


/* POST de inserção de um comentário */
router.post('/recurso/:id/comentario', verifyToken, (req,res)=>{
  axios.post('http://localhost:8001/recurso/' + req.params.id + '/comentario?token=' + req.cookies.token, req.body)
    .then(dados => {
      res.jsonp(dados)
      //res.render('homepage', {user : req.user})
    })
    .catch(e => res.render('error'))
})

/* POST de inserção de uma avaliação */
router.post('/recurso/:id/avaliacao', verifyToken, async (req,res) => {
  var num = await fez_avaliacao(req.user,req.cookies.token, req.params.id)
  if( num == 0){
    axios.post('http://localhost:8001/recurso/' + req.params.id + '/avaliacao?token=' + req.cookies.token, req.body)
      .then(dados => {
        res.jsonp(dados)
        res.render('homepage', {user : req.user})
      })
      .catch(e => res.render('error'))
  }
  else{
    axios.put('http://localhost:8001/recurso/' + req.params.id + '/avaliacao?token=' + req.cookies.token, req.body)
      .then(dados => {
        res.jsonp(dados)
        res.redirect('home')
      })
      .catch(e => res.render('error'))
  }
})

/* POST de inserção de um tipo */
router.post("/recurso/addTipo", verifyToken, async(req, res) => {
  axios.post("http://localhost:8001/recurso/addTipo?token=" + req.cookies.token, req.body)
    .then(dados => {
      res.redirect('/users/home')  
    })
    .catch(e => res.render('error'))
})

/* Altera privacidade */
router.post("/alteraPrivacidade/:id/:priv", verifyToken, async (req, res) => {
  axios.put("http://localhost:8001/recurso/alteraPrivacidade/"+req.params.id+"/"+req.params.priv+"?token=" + req.cookies.token)
    .then(dados => {
      res.redirect("/users/home")
    })
    .catch(e => res.render('error'))
})

/* Apagar ficheiro */
router.post("/apagaRecurso/:id", verifyToken, async (req, res) => {
  axios.delete("http://localhost:8001/recurso/apagaRecurso/"+req.params.id+"?token=" + req.cookies.token)
    .then(dados => {
      res.redirect('/users/home')
    })
    .catch(e => res.render('error'))
})

/* GET dos recursos que é produtor */
router.get('/meusRecursos', verifyToken,  getNotificacoes, async(req, res) => {
  var anosAux = await anos(req.cookies.token)
  var tiposAux = await tipos(req.cookies.token)
  var estrelasAux = await valores_estrelas(1,req.cookies.token,req.user)

  await axios.get('http://localhost:8001/recursos/produzidos?token=' + req.cookies.token)
    .then( dados => { 
      res.render('recursos', {recursos : dados.data, user: req.user, anos: anosAux, tipos: tiposAux,notificacoes: req.user.notificacoes, estrelas:estrelasAux}) 
    })
    .catch(e => res.render('error'))
})

/* GET dos recursos públicos */
router.get('/outrosRecursos', verifyToken, getNotificacoes, async(req, res) => {
  var anosAux = await anos(req.cookies.token)
  var tiposAux = await tipos(req.cookies.token)
  var estrelasAux = await valores_estrelas(2,req.cookies.token,req.user)

  await axios.get('http://localhost:8001/recursos/publicos?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursos', {recursos : dados.data, user: req.user, anos: anosAux, tipos: tiposAux,notificacoes: req.user.notificacoes, estrelas:estrelasAux})
    })
    .catch(e => res.render('error'))
})

/* GET dos recursos de determinado ano */
router.get('/recursosAno/:ano', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "filtro ano"

  axios.get('http://localhost:8001/recursos/ano/' + req.params.ano + '?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, ano: req.params.ano, notificacoes: req.user.notificacoes})
    })
    .catch(e => res.render('error'))
})

/* GET dos recursos de determinado tipo */
router.get('/recursosTipo/:tipo', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "filtro tipo"

  axios.get('http://localhost:8001/recursos/tipo/' + req.params.tipo + '?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, tipo: req.params.tipo, notificacoes: req.user.notificacoes})
    })
    .catch(e => res.render('error'))
})

/* GET de um recurso */
/* GET de um recurso */
router.get('/recurso/:id', verifyToken, getNotificacoes, async(req,res)=>{
  var usersAux
  await axios.get('http://localhost:8002/utilizadores/')
    .then(dados => { usersAux = dados.data })
    .catch(e => res.render('error'))

  var num = await fez_avaliacao(req.user,req.cookies.token, req.params.id)  

  axios.get('http://localhost:8001/recurso/' + req.params.id + '?token=' + req.cookies.token)
    .then(dados => {
      res.render('recurso', {recurso: dados.data, user: req.user, users: usersAux, notificacoes: req.user.notificacoes, aval: num})
    })
    .catch(e => res.render('error'))
})

/* Sort dos recursos por autor */ 
router.get('/sortAutor', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "sort autor"
  var estrelasAux = await valores_estrelas(3,req.cookies.token,req.user)
  console.log(estrelasAux)

  axios.get('http://localhost:8001/recursos/sortAutor?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, notificacoes: req.user.notificacoes,estrelas:estrelasAux})
    })
    .catch(e => res.render('error'))
})

/* Sort dos recursos por class */ 
router.get('/sortClass', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "sort class"
  var estrelasAux = await valores_estrelas(3,req.cookies.token,req.user)
  console.log(estrelasAux)

  axios.get('http://localhost:8001/recursos/sortClass?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, notificacoes: req.user.notificacoes, estrelas:estrelasAux })
    })
    .catch(e => res.render('error'))
})

/* Sort dos recursos por data */ 
router.get('/sortData', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "sort data"
  var estrelasAux = await valores_estrelas(3,req.cookies.token,req.user)
  console.log(estrelasAux)

  axios.get('http://localhost:8001/recursos/sortData?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, notificacoes: req.user.notificacoes, estrelas:estrelasAux})
    })
    .catch(e => res.render('error'))
})

/* Sort dos recursos por tipo */ 
router.get('/sortTipo', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "sort tipo"
  var estrelasAux = await valores_estrelas(3,req.cookies.token,req.user)
  console.log(estrelasAux)

  axios.get('http://localhost:8001/recursos/sortTipo?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, notificacoes: req.user.notificacoes,estrelas:estrelasAux})
    })
    .catch(e => res.render('error'))
})

/* Sort dos recursos por título */ 
router.get('/sortTitulo', verifyToken, getNotificacoes, async(req, res) => {
  var opcao = "sort titulo"
  var estrelasAux = await valores_estrelas(3,req.cookies.token,req.user)
  console.log(estrelasAux)

  axios.get('http://localhost:8001/recursos/sortTitulo?token=' + req.cookies.token)
    .then(dados => {
      res.render('recursosBy', {recursos : dados.data, user: req.user, opcao: opcao, notificacoes: req.user.notificacoes, estrelas:estrelasAux})
    })
    .catch(e => res.render('error'))
})

/* GET para pedir uma nova lista de recursos depois de apagar um */
router.get('/apagarNotificacao', verifyToken, async (req, res) => {
  axios.post("http://localhost:8002/utilizadores/notificacao/apagar", req.query)
    .then(dados => {
      res.redirect("/users/home")
    })
    .catch(err => {
      console.log("Não foi possível apagar a notificação")
      res.redirect('home')
    })
})

/* GET dos users(para o admin) */
router.get('/', verifyToken, getNotificacoes, (req, res) => {
  axios.get('http://localhost:8002/utilizadores/')
    .then(dados => {
      res.render('utilizadores', {users : dados.data, user: req.user, notificacoes: req.user.notificacoes})
    })
    .catch(e => res.render('error'))
})


module.exports = router;
