var mongoose = require('mongoose')
var Schema = mongoose.Schema

var EstrelaSchema = new Schema({
	email_produtor: {type: String, required: true}, // email do produtor
	valor: { type: Number, required: true}
})

var ComentarioSchema = new Schema({
	email_produtor: {type: String, required: true}, // email do produtor
	descricao: {type: String, required: true},
	data: {type: String, default: new Date().toISOString().substr(0,16)} // falta pôr isto no perfil dos recursos
})

var TipoSchema = new Schema({
	descricao: {type: String, required: true}
})

var RecursoSchema = new Schema({
	email_produtor: {type: String, required: true}, // email do produtor
	tipo: {type: TipoSchema, required: true},
	titulo: {type: String, required: true},
	subtitulo: {type: String},
	nome: {type: String },
	dataReg: {type: String, default: new Date().toISOString().substr(0,16)},
	privacidade: {type: Boolean, default: true},
	estrelas: {type: [EstrelaSchema], default: []},
	avaliacao: {type: Number, default: 0},
	comentarios: {type: [ComentarioSchema], default: []}
})

module.exports = { 
	recurso: mongoose.model('Recurso', RecursoSchema, 'recursos'),
	tipo: mongoose.model('Tipo', TipoSchema, 'tipos')
}