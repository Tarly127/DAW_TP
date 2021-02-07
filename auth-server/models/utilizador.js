var mongoose = require('mongoose')
var Schema = mongoose.Schema
var bcrypt = require('bcrypt')

var NotificacaoSchema = new mongoose.Schema({
	titulo: {type: String, required: true},
	nome_pub: {type: String, required: true},
	rec_id: {type: String, required: true},
	data_pub: {type: String, default: new Date().toISOString().substr(0,16)}
})

var UtilizadorSchema = new mongoose.Schema({
	email: {type: String, required: true, unique: true},
	nome: {type: String, required: true},
	password: {type: String, required: true},
	filiacao: {type: String, required: true},
	nivel: {type: String, default: "1"},
	dataReg: {type: String, default: new Date().toISOString().substring(0,16)},
	dataUlt: {type: String, default: new Date().toISOString().substring(0,16)},
	notificacoes: {type: [NotificacaoSchema], default: []}
})

UtilizadorSchema.pre('save', async function(next) {
	var hash = await bcrypt.hash(this.password, 10)
	this.password = hash
	next()
})	


UtilizadorSchema.methods.isValidPassword = async function(password){
	var user = this
	var compare = await bcrypt.compare(password, user.password)
	return compare
}

module.exports = mongoose.model('Utilizador', UtilizadorSchema, 'utilizadores')
