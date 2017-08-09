'use strict'
// json nos ayuda a obtener el body de los request en las peticiones que nos
// hacen a la ruta definida
// send, metodo de micro nos ayuda, asi mismo, en la siguiente linea de comentarios
// le indicamos a lintern que no nos arroje el error de variables no usadas
import { send, json } from 'micro' // eslint-disable-line no-unused-vars--Soloquitarestacoment
// a enviar respuestas en las peticiones que nos hacen al servidor
import HttpHash from 'http-hash'
import Db from 'platzigram-db'// Importamos el paquete de platzigram-db
import config from './config'
import DbStub from './test/stub/db'

// Para poder isar stubs podemos usar proxyquire para seleccionar el tipo
// de stub que deseamos utilizar, ahora bien debido a que setup no esta definido
// y tenemos que definir a la antigua el stub que vamos a utilizar
// Vamos a decidir si estamos en un ambiente de pruebas o bien estamos en un
// ambiente de produccion si estamos en un ambiente de pruebas, vamos a devolver
// el objeto de la clase stub.
// Obtenemos el entorno de ejecucion o si no se define ningun tipo de variable
// el entorno de ejecucion es produccion
const env = process.env.NODE_ENV || 'production'
console.log('Este es el objeto de env ' + env)
// Esta variable de entorno se definira en el package.JSON para indicar que se van
// a realizar los test

// Y creamos una instancia de la clase Db, recordar que podemos mandarle
// parametros para configurar de inicio nuestra base de datos
console.log('Esta es la configuracion de config.db ' + config.db)
// Le pasamos la configuracion exportada de la base de datos
let db = new Db() // eslint-disable-line no-unused-vars--Soloquitarestacoment

if (env === 'test') {
  console.log(process.env.NODE_ENV)
  db = new DbStub()
}

const hash = HttpHash()

// Seteamos la ruta para guardar un usuario
hash.set('POST /', async function saveUser (req, res, params) {
  // Para esto no obtenemos el usuario de la url pues la url no recibe
  // parametros como tal, para ello utilizamos la funcion json y obtenemos
  // el usuario junto con todos sus parametros de request y los transformamos
  // en un objeto json
  let user = await json(req)
  await db.connect()
  let created = await db.saveUser(user)
  await db.disconnect()
  // Despues de desconectarnos, nos aseguramos de que el objeto-usuario salvado o
  // creado no contenga los parametros o propiedades email y password, pues este
  // objeto será retornado y estos campos son de especial cuidado
  delete created.email
  delete created.password
  // Por último enviamos el objeto de la respuesta
  send(res, 201, created)
})

hash.set('GET /:username', async function getUser (req, res, params) {
  let username = params.username
  await db.connect()
  let user = await db.getUser(username)
  await db.disconnect()
  delete user.email
  delete user.password
  send(res, 200, user)
})

// Enrutador que nos ayuda a encontrar las rutas creadas de manera
// dinamica.
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
