'use strict'
import { send, json } from 'micro'
import HttpHash from 'http-hash'
import Db from 'platzigram-db'
import utils from './lib/utils'
import DbStub from './test/stub/db'
import config from './config'

const env = process.env.NODE_ENV || 'production'
let db = new Db()

if (env === 'test') {
  console.log(process.env.NODE_ENV)
  db = new DbStub()
}

const hash = HttpHash()

hash.set('POST /', async function authenticate (req, res, params) {
  let credentials = await json(req)
  console.log(credentials)
  await db.connect()
  let auth = await db.authenticate(credentials.username, credentials.password)
  if (!auth) {
    return send(res, 401, { error: 'invalid token' })
  }
  let token = await utils.signToken({
    username: credentials.username
  }, config.secret)
  send(res, 200, token)
})

export default async function main (req, res) {
  // ¿Que vamos a necesitar de request (req) para poder hacer match con la URL
  // El metodo que viene en el request, mediante req yo puedo obtener la URL
  // completa de donde se llamo y con que metodo me llamaron (GET o POST)
  // Extraemos las dos propiedades del req utilizando object structuring
  let { method, url } = req
  // que es lo mismo que pones lo siguiente
  // let method = req.method
  // let url = req.url
  // Con HTTPHASH podemos ver si hay un match, utilizamos la funcion GET
  // siguiendo el siguiente parametro 'GET /:id', es por ello que se coloca en
  // uppercase espacio y luego la url
  let match = hash.get(`${method.toUpperCase()} ${url}`)
  // Verificamos si existe algun match por medio de su handler o manejador
  // que es el que se encargará de lo que pasará o que se enviará una vez entrada a
  // la pagina
  if (match.handler) {
    // Recordamos que el handler es una funcion asincrona por tanto
    // nos retornará una promesa que debe de ser suelta, por lo que
    // se resuelve con await, tambien tenemos que tener en cuenta
    // que algunas consultas pueden fallar y es por ello que utilizamos
    // try catch
    try {
      // match.handler es una funcion asincrona por lo que tenemos que ejecutarla
      // con await, a handler le pasamos los parametros req, res que se obtienen
      // de la funcion principal y los parametros que se obtienen de la url no los
      // pasa por un objeto y con esto ejecutar la ruta
      await match.handler(req, res, match.params)
    } catch (e) {
      // Se manda un error en caso de haberlo, el cual se obtiene de el reject que nos lanza el servidor y mandamos un status de 500
      send(res, 500, { error: e.message })
    }
  } else {
    // Enviamos  nuestra respuesta en caso de no encontrar
    // respuesta o de no existir un match de las rutas
    send(res, 404, { error: 'route not found' })
  }
}
