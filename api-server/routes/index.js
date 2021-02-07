var express = require('express')
var router = express.Router()
var fs = require('fs')
var formidable = require('formidable');

var Recurso = require('../controllers/recurso')
var Tipo = require('../controllers/recurso')
//var { recurso: Recurso, tipo: Tipo } = require('../controllers/recurso')
/* API - Recursos */

function mongoexport(collection) {
  exec('mongoexport --db myGoogleDrive--collection '+collection+' --out ./files/'+collection+'.json --jsonArray', (err, stdout, stderr) => {
    if (err) {
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

/* Insere comentário */
router.post('/recurso/:id/comentario', (req, res) => {
	console.log(req.body)
	Recurso.inserir_comentario(req.params.id, req.body)
		.then(data => res.status(201).jsonp(data))
		.catch(erro => res.status(500).send(erro + 'Erro na inserção do comentário.'))
})

/* Insere avaliação */
router.post('/recurso/:id/avaliacao', (req, res) => {
	console.log(req.body)
	Recurso.inserir_estrelas(req.params.id, req.body)
		.then(dados => {
			Recurso.consultarId(req.params.id)
				.then(dados2 => {
					var sum = 0
					var avg = 0
					if(dados2.estrelas.length > 0){
						for(var i = 0; i < dados2.estrelas.length; i++){
							sum += dados2.estrelas[i].valor
						}
						avg = Math.round(sum / dados2.estrelas.length)
					}
					else avg = req.body.valor
					Recurso.inserir_avaliacao(req.params.id, avg)
						.then(dados3 => res.status(201).jsonp(dados3))
				})
		})
		.catch(erro => res.status(500).send(erro + 'Erro na avaliação do recurso.'))
})

/* Insere avaliação */
router.put('/recurso/:id/avaliacao', (req, res) => {
	console.log(req.body)
	Recurso.atualizar_estrelas(req.user.email,req.params.id, req.body)
		.then(dados => {
			Recurso.consultarId(req.params.id)
				.then(dados2 => {
					var sum = 0
					var avg = 0
					if(dados2.estrelas.length > 0){
						for(var i = 0; i < dados2.estrelas.length; i++){
							sum += dados2.estrelas[i].valor
						}
						avg = Math.round(sum / dados2.estrelas.length)
					}
					else avg = req.body.valor
					Recurso.inserir_avaliacao(req.params.id, avg)
						.then(dados3 => res.status(201).jsonp(dados3))
				})
		})
		.catch(erro => res.status(500).send(erro + 'Erro na avaliação do recurso.'))
})

/* Consulta um recurso */
router.get('/recurso/:id', (req, res) => {
	Recurso.consultarId(req.params.id)
		.then(data => res.jsonp(data))
		.catch(erro => res.status(500).send(erro + 'Erro na consulta do recurso.'))
})

/* Upload de recurso */
router.post('/recurso/upload/:filename', (req, res) => {
	var email_produtor = req.user.email
	var tipo = { descricao : req.body.tipo }
	var titulo = req.body.titulo
	var subtitulo = req.body.subtitulo 
	var nome = req.params.filename
	var privacidade = req.body.privacidade == "false" ? false : true

	Recurso.inserir({email_produtor, tipo, titulo, subtitulo, nome, privacidade})
	.then(data => {
		res.status(201).jsonp(data)
	})
	.catch(erro => {
		res.status(500).send('Erro na inserção do recurso: ' + erro)
	})
})

/* Lista de recursos do utilizador */
router.get('/recursos/produzidos', (req, res) => {
	console.log(req.user.email)
	Recurso.recursos_produzidos(req.user.email)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos públicos ao utilizador */
router.get('/recursos/publicos', (req, res) => {
	console.log(req.user.email)
	Recurso.recursos_publicos(req.user.email, req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de anos */
router.get('/recursos/anos', (req, res) => {
	Recurso.anos()
		.then(data => {
			console.log(data)
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de anos: ' + erro))
})


/* Lista de tipos */
router.get('/recursos/tipos', (req, res) => {
	Tipo.tipos()
		.then(data => {
			console.log(data)
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de tipos: ' + erro))
})

/* Lista de recursos de determinado ano */
router.get('/recursos/ano/:ano', (req, res) => {
	console.log(req.params.ano)
	Recurso.recursos_by_ano(req.user.email,req.params.ano,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos de determinado tipo */
router.get('/recursos/tipo/:tipo', (req, res) => {
	Recurso.recursos_by_tipo(req.user.email,req.params.tipo,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos ordenada por autor */
router.get('/recursos/sortAutor', (req, res) => {
	Recurso.sort_by_autor(req.user.email,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos ordenada por classificação */
router.get('/recursos/sortClass', (req, res) => {
	Recurso.sort_by_class(req.user.email,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos ordenada por data */
router.get('/recursos/sortData', (req, res) => {
	Recurso.sort_by_data(req.user.email,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos ordenada por tipo */
router.get('/recursos/sortTipo', (req, res) => {
	Recurso.sort_by_tipo(req.user.email,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos ordenada por título */
router.get('/recursos/sortTitulo', (req, res) => {
	Recurso.sort_by_titulo(req.user.email,req.user.nivel)
		.then(data => {
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Lista de recursos com determinado título */
router.get('/recursos/com/:titulo', (req, res) => {
	Recurso.com_titulo(req.params.titulo)
		.then(data => {
			console.log(data)
			res.status(200).jsonp(data)
		})
		.catch(erro => res.status(500).send('Erro na consulta da lista de recursos com acesso: ' + erro))
})

/* Insere tipo */
router.post('/recurso/addTipo', (req,res) => {
	Tipo.add_tipo({descricao: req.body.tipo})
		.then(data => {res.jsonp(data)})
		.catch(erro => res.status(500).send(erro + 'Erro na inserção de um novo tipo.'))
})

/* Altera privacidade */
router.put('/recurso/alteraPrivacidade/:id/:priv', (req,res) => {
	Recurso.altera_privacidade(req.params.id, req.params.priv)
		.then(data => {res.jsonp(data)})
		.catch(erro => res.status(500).send(erro + 'Erro na inserção de um novo tipo.'))
})

/* Apagar recurso */
router.delete('/recurso/apagaRecurso/:id', (req, res) => {
	Recurso.remover(req.params.id)
		.then(data => res.jsonp(data))
		.catch(erro => res.status(500).send(erro + 'Erro na remoção do recurso.'))
})

router.get('/recurso/:id/comentarios', (req, res) => {
	Recurso.comentarios_recurso(req.params.id)
		.then(data => res.jsonp(data))
		.catch(erro => res.status(500).send(erro + 'Erro na listagem de comentários do recurso.'))
})



module.exports = router