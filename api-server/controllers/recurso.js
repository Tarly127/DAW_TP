var { recurso: Recurso, tipo: Tipo } = require('../models/recurso')
//var Recurso = require('../models/recurso')
//var Tipo = require('../models/recurso')
const ADMIN = "0"

/* Lista de recursos públicos ao utilizador */
module.exports.recursos_publicos = (email, nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find({email_produtor:{$ne: email}})
			.exec()
	else
		return Recurso
			.find({email_produtor:{$ne: email},privacidade: false})
			.exec()
}

/* Lista de recursos produzidos por determinado utilizador */
module.exports.recursos_produzidos = email => {
	return Recurso
		.find({email_produtor: email})
		.exec()
}

/* Lista de recursos de um determinado tipo */
module.exports.recursos_by_tipo = (email, option, nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find({'tipo.descricao': option})
			.exec()
	else
		return Recurso
			.find({'tipo.descricao':option, $or:[{email_produtor: email}, {privacidade: false}]})
			.exec()
}

/* Lista de recursos de um determinado ano */
module.exports.recursos_by_ano = (email, option, nivel) => {
	if(nivel == ADMIN)
		return Recurso
		.find({
			"dataReg": {
        		$gte: option+"-01-01T00:00", 
        		$lt: option+"-31-12T00:00"
			}
		})
		.exec()
	else
		return Recurso
		.find({
			"dataReg": {
        		$gte: option+"-01-01T00:00", 
        		$lt: option+"-31-12T00:00"
			}, 
			$or:[{email_produtor: email}, {privacidade: false}]
		})
		.exec()	
	
}

/* Lista de recursos ordenadas por autor */
module.exports.sort_by_autor = (email,nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find()
			.sort({email_produtor: 1})
			.exec()
	else
		return Recurso
			.find({$or:[{email_produtor: email}, {privacidade: false}]})
			.sort({email_produtor: 1})
			.exec()
	
}

/* Lista de recursos ordenadas por class */
module.exports.sort_by_class = (email, nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find()
			.sort({avaliacao: -1})
			.exec()
	else
		return Recurso
			.find({$or:[{email_produtor: email}, {privacidade: false}]})
			.sort({avaliacao: -1})
			.exec()
	
}

/* Lista de recursos ordenadas por data */
module.exports.sort_by_data = (email, nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find()
			.sort({dataReg: 1})
			.exec()
	else
		return Recurso
			.find({$or:[{email_produtor: email}, {privacidade: false}]})
			.sort({dataReg: 1})
			.exec()
	
} 

/* Lista de recursos ordenadas por tipo */
module.exports.sort_by_tipo = (email, nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find()
			.sort({'tipo.descricao': 1})
			.exec()
	else
		return Recurso
			.find({$or:[{email_produtor: email}, {privacidade: false}]})
			.sort({'tipo.descricao': 1})
			.exec()
	
} 

/* Lista de recursos ordenadas por titulo */
module.exports.sort_by_titulo = (email, nivel) => {
	if(nivel == ADMIN)
		return Recurso
			.find()
			.sort({titulo: 1})
			.exec()
	else
		return Recurso
			.find({$or:[{email_produtor: email}, {privacidade: false}]})
			.sort({titulo: 1})
			.exec()
	
} 

/* Lista de recursos com determiando título */
module.exports.com_titulo = (titulo) => {
	return Recurso
		.find({titulo:{$regex : titulo}})
		.exec()
}

/* Lista de anos existentes nos recursos */
module.exports.anos = () => {
	return Recurso
		.distinct('dataReg')
		.exec()
}

/* Lista de tipos existentes nos recursos */
module.exports.tipos = () => {
	return Tipo
		.distinct('descricao')
		.exec()
}

/* Info de um recurso, procura por id */
module.exports.consultarId = id => {
	return Recurso
		.findOne({_id: id})
		.exec()
}

/* Info de um recurso, procura por id */
module.exports.consultar = email => {
	return Recurso
		.findOne({email_produtor: email})
		.exec()
}

/* Inserir recurso */
module.exports.inserir = recurso => {
	console.log("Create recurso")
	var newRecurso = Recurso.create(recurso)
	return newRecurso
}

/* Inserir tipo */
module.exports.add_tipo = (tipo) => {
	var newTipo = Tipo.create(tipo)
	return newTipo
}

/* Inserir comentário */
module.exports.inserir_comentario = (id, comentario) => {
	return Recurso
		.updateOne({_id: id}, {$push: {comentarios: comentario}})
		.exec()
}

/* Inserir estrelas */
module.exports.inserir_estrelas = (id, estrela) => {
	return Recurso
		.updateOne(
			{_id: id},
			{$push: {estrelas: estrela}}
		)
		.exec()
}

/* Inserir estrelas */
module.exports.atualizar_estrelas = (email, id, estrela) => {
	return Recurso
		.updateOne(
			{_id: id, "estrelas.email_produtor":email},
			{$set: {"estrelas.$.valor": estrela.valor}}
		)
		.exec()
}

/* Avaliação */
module.exports.inserir_avaliacao = (id, aval) => {
	return Recurso
		.updateOne(
			{_id: id},
			{$set: {avaliacao: aval}}
		)
		.exec()
}


/* Altera privacidade de um recurso */
module.exports.altera_privacidade = (id, privacidade) => {
	return Recurso
		.updateOne(
			{_id: id}, 
			{$set: {privacidade: privacidade}})
		.exec()
}

/* Remove recurso */
module.exports.remover = (id) => {
	return Recurso
		.remove({_id: id})
		.exec()
}

/* Listar comentários de um recurso  */
module.exports.comentarios_recurso = (id) => {
	return Recurso
		.find({_id_recurso: id}, {comentarios: 1})
		.sort({data: 1})
		.exec()
}
