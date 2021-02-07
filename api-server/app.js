var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser')
var jwt = require('jsonwebtoken');

var indexRouter = require('./routes/index');

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/myGoogleDrive', 
      { useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000});
  
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro de conexão ao MongoDB...'));
db.once('open', function() {
  console.log("Conexão ao MongoDB realizada com sucesso...")
});

const { exec } = require('child_process');

function mongoimport(collection) {
  exec('mongoimport --db myGoogleDrive --collection '+collection+' --file ./files/'+collection+'.json --jsonArray', (err, stdout, stderr) => {
    if (err) {
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}
mongoimport('recursos')

var Recurso = require('./controllers/recurso')

var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// Verifica se o pedido veio com o token de acesso (PARA JÁ VOU REMOVER PARA PODER TESTAR SEM O TOKEN)
app.use(function(req, res, next){
  var myToken = req.query.token || req.body.token
  if(myToken){
    jwt.verify(myToken, "V{8xV^Nb<<8w[}.", function(e, payload){
      if(e){
        res.status(401).jsonp({error: e})
      }
      else{
        req.user = {
          email: payload.email,
          nivel: payload.nivel
        }
        next()
      }
    })
  }
  else{
    res.status(401).jsonp({error: "Token inexistente!"})
  }
})

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).jsonp({error: err.message})
});

module.exports = app;