'use strict'
// json nos ayuda a obtener el body de los request en las peticiones que nos
// hacen a la ruta definida
import { send, json } from 'micro' // send, metodo de micro nos ayuda
// a enviar respuestas en las peticiones que nos hacen al servidor
import HttpHash from 'http-hash'
import Db from 'platzigram-db'// Importamos el paquete de platzigram-db
import config from './config'
import DbStub from './test/stub/db'
import utils from './lib/utils'

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
let db = new Db() // Le pasamos la configuracion exportada de la base de datos

if (env === 'test') {
  console.log(process.env.NODE_ENV)
  db = new DbStub()
}

const hash = HttpHash()

hash.set('GET /tag/:tag', async function byTag (req, res, params) {
  let tag = params.tag
  await db.connect()
  let images = await db.getImagesByTag(tag)
  await db.disconnect()
  send(res, 200, images)
})

// Definimos esta ruta antes de la del id para que no existan colisiones
// y escoga la ruta que nosotros deseamos y no la primera que encuentra
hash.set('GET /list', async function list (req, res, params) {
  await db.connect()
  let images = await db.getImages()
  await db.disconnect()
  send(res, 200, images)
})

// Definimos la primera ruta con ayuda del metodo de hash set()
// Realizamos la diferenciacian entre GET y POST definiendo las
// rutas de manera similar que en express, como handler le Definimos
// una funcion asincrona pues estamos utiliando micro y lo transpila
hash.set('GET /:id', async function getPicture (req, res, params) {
  let id = params.id
  await db.connect()
  // Recordar que las getImage es una funcion asincrona por tanto necesitamos
  // que esta funcion sea resuelta pues devuelve una promesa
  let image = await db.getImage(id)
  await db.disconnect()
  send(res, 200, image)
  // Con params podemos acceder al id de la ruta que nos llega por la URL
  // Cuando se acceda a esta ruta, vamos a contestar con una respuesta,
  // un status 200 y los parametros de la ruta
  // send(res, 200, params)
})

hash.set('POST /', async function postPicture (req, res, params) {
  // Lo siguiente es extraer el body mediante json (metodo de micro), definimos
  // una imagen y esperamos a resolver la promesa de la funcionalidad json a que nos
  // devuelva el objeto ya en json
  let image = await json(req)
  // Por medio del try catch nosotros podemos meter toda la logica de autentificacion
  try {
    // Extraemos el token del header del request esto mediante utils y resolvemos la promesa
    let token = await utils.extractToken(req)
    // Verificamos si el token es valido o no, obtenemos el payload encodificado
    let encoded = await utils.verifyToken(token, config.secret)
    if (encoded && encoded.userId !== image.userId) {
      throw new Error('invalid token')
    }
  } catch (e) {
    // Si existe un error mandamos un codigo 401 de que no se ha podido autentificar
    return send(res, 401, { error: 'invalid token' })
  }
  await db.connect()
  let created = await db.saveImage(image)
  await db.disconnect()
  // Enviamos la respuesta que decibe el objeto de res, el codigo
  // de la respuesta que es 201 y devolvemos el objeto que creamos
  send(res, 201, created)
})

// Es una buena practica siempre nombrar a las funciones para poder realizar
// acciones posteriores como debbuging, mejora de performance, profiling
hash.set('POST /:id/like', async function likePicture (req, res, params) {
  let id = params.id
  await db.connect()
  // Le damos like con referencia de likeImage
  // Recordar que todas las funciones de la base de datos son promesas que deben de
  // ser resuelta y posteriormente comparadas, si no son resueltas tendremos un
  // objeto mas complejo. Para ello utilizamos await
  let image = await db.likeImage(id)
  await db.disconnect()
  send(res, 200, image)
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
