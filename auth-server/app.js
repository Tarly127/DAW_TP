var createError = require('http-errors')
var path = require('path')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var express = require('express')
var logger = require('morgan')
var axios = require('axios')
var jwt = require('jsonwebtoken')

var { v4 : uuidv4 } = require('uuid')
var session = require('express-session')
var FileStore = require('session-file-store')(session)

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

var mongoose = require('mongoose')

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
mongoimport('utilizadores')

var Utilizador = require('./controllers/utilizador')

/* Registo de utilizador */
passport.use('registar', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async(req, email, password, done) => {
  try{
    var utilizador = await Utilizador.inserir(req.body)
    return done(null, utilizador)
  } catch(error){
    return done(error)
  }
    
}))

/* Login de utilizador */
passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try{
        var utilizador = await Utilizador.consultar(email)
        console.log(utilizador)
        if(!utilizador)
            return done(null, false, {message: 'Utilizador não existe!'})
        var valid = await utilizador.isValidPassword(password)
        if(!valid)
            return done(null, false, {message: 'Password inválida!'})
        else
        {
          await Utilizador.login(email)
          return done(null, utilizador, {message: 'Login feito com sucesso.'})
        }
        
    }
    catch(error){
        return done(error)
    }
}))

/* Serialização do utilizador (Codificação) */
passport.serializeUser((user, done) => {
   console.log('Serielização, email: ' + user.email)
   done(null, user.email)
})


/* Deserialização do utilizador (Codificação) */
passport.deserializeUser((user, done) => {
    console.log('Desserielização, email: ' + user.email)
    User.consultar(email)
      .then(dados => done(null, dados))
      .catch(erro => done(erro, false))
})

//var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
//var utilizadoresRouter = require('./routes/api/utilizadores')
//var recursosRouter = require('./routes/api/recursos')
//var UtilizadorModel = require('./models/utilizador')

var app = express();

/* Middleware da Sessão */
app.use(session({
  genid: req => {
    return uuidv4()
  },
  //store: new FileStore(), /* guarda a sessão na parte do servidor quando este vai abaixo */
  secret: 'myGoogleDrive',
  resave: false,
  saveUninitialized: false
}))




app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('myGoogleDrive'));

app.use(passport.initialize())
app.use(passport.session())

//app.use(function(req, res, next){
//  console.log('Signed Cookies: ', JSON.stringify(req.signedCookies))
//  console.log('Session: ', JSON.stringify(req.session))
//  next()
//})

app.use('/utilizadores', usersRouter);
//app.use('/api/', utilizadoresRouter);
//app.use('/api/', recursosRouter);
//app.use('/', indexRouter);

/* 404 e reencaminha para o handler do erro */
app.use(function(req, res, next) {
  next(createError(404));
});

/* Handler de erro */
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
