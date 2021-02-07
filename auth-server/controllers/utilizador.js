var Utilizador = require('../models/utilizador')

/* Lista de utilizadores */
module.exports.lista_utilizadores = () => {
	return Utilizador
		.find()
		.sort('nome')
		.exec()
}

/* Adicionar uma nova notificação a TODOS os utilizadores exceto o que a gerou */
module.exports.nova_notificacao = (email, notificacao) => {
	return Utilizador
		.updateMany({ email : {$ne : email}}, {$push : {notificacoes : notificacao}})
		.exec()
}

/* Remover uma notificação */
module.exports.delete_notificacao = (email, id_not) => {
	return Utilizador
		.updateOne({ email : email }, { $pull : { 'notificacoes' : { rec_id : id_not } } })
		.exec()
}

/* Info de um utilizador, procura por email */
module.exports.consultar = email => {
	return Utilizador
		.findOne({email: email})
		.exec()
}

/* Info de um utilizador, procura por id */
module.exports.consultarId = id => {
	return Utilizador
		.findOne({_id: id})
		.exec()
}

/* Inserir utilizador */
module.exports.inserir = utilizador => {
	var novo = new Utilizador(utilizador)
	return novo.save()
}

/* Atualizar utilizador */
module.exports.atualizar = function(u){
	return Utilizador.findByIdAndUpdate({nome: u.nome}, u, {new: true})
/*	return Utilizador
		.update({_id: id},
			{$set:utilizador})
		.exec() */
}

/* Remover utilizador */
module.exports.remover = function(unome){
	return Utilizador.deleteOne({nome: unome})
/*	return Utilizador
		.remove({_id: id})
		.exec() */
}

/* Altera a data de último login */
module.exports.login = email => {
	var date = new Date().toISOString().substr(0,16)
	return Utilizador
		.findOneAndUpdate({ "email" : email },{"$set" : { "dataUlt" : date } })
}

/*
 Listar recursos de um utilizador 
module.exports.recursos_utilizador = (id) => {
	return Recurso
		.find({_id_utilizador: id})
		.sort({data: -1})
		.exec()
}
*/










