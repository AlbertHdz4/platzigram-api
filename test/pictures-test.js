'use strict'

import test from 'ava'
import micro from 'micro'
// import uuid from 'uuid-base62'
import listen from 'test-listen'
import request from 'request-promise'
import fixtures from './fixtures/'
import pictures from '../picture'
import utils from '../lib/utils'
import config from '../config'

test.beforeEach(async (t) => {
  let srv = micro(pictures)
  t.context.url = await listen(srv)
})

test('GET /:id', async (t) => {
  let image = fixtures.getImage()
  // let id = uuid.v4()
  // En la siguiente linea creamos un servidor
  // Enviamos un request listener (peticion de escuchador) asincrono
  // el cual nos ayudará a enviar respuestas desde el servidor
  // Pictures solo retorna una funcion asincrona

  // Realizamos el refactor final con ayuda de beforeEach
  let url = t.context.url

  // let srv = micro(pictures)// async (req, res) => { Esto era antes de hacer el refactor
    // Send es un metodo de micro que nos ayuda a enviar respuestas
    // al cliente desde le serivdor, recibe como primer parametro
    // la respuesta, segundo el status que se requiere enviar, y el valor
    // de la respuesta como tal en este casi del id
    // send(res, 200, { id })
  // })
  // ¿Como funciona listen? nos va  devolver una URL con URL y puerto
  // de este servidor (srv) nos va a correr el seridor y con que URL esta
  // corriendo, el puerto será un puerto efimero por parte de listen
  // Al igual que en las bases de datos, solo se creará el servidor en
  // tiempos de test y cuando estos terminen, este será desechado
  // let url = await listen(srv)
  // listen regresa una promesa por eso la resolvemos con await
  // La url que nos devuelve la promesa de listen es la que pasamos
  // al body junto con el id para asegurar que la respuesta sea la misma
  let options = {
    url: `${url}/${image.publicId}`,
    json: true
  }
  let body = await request(options) // { url: `${url}/${image.publicId}`, json: true })
  // Realizamos la peticion HTTP, le indicamos
  // que nos regrese los datos en formato JSON
  // Validamos que el cuerpo que nos retorna sea igual al objeto que obtiene el id
  t.deepEqual(body, image)
})

// Otra caracteristica que tiene AVA es que podemos definir los test sin la
// necesidad de que es lo que realiza el test
test('no token POST /', async (t) => {
  let image = fixtures.getImage()
  let url = t.context.url
  // Nosotros estamos utilizando request-promise para realizar nuestras
  // peticiones HTTP a nuestras rutas y vamos a ver como podemos hacer
  // con promise una peticion tipo POST,
  // Creamos las opciones del request
  let options = {
    method: 'POST',
    // Vamos a pasar la url a la cual vamos a realizar la peticion (que es
    // la raiz del microservicio)
    url: url,
    // Indicamos que el request es json y enviamos el request en json y
    // nos responden en json
    json: true,
    // En este caso vamos a enviar en el body de nuestra peticion,
    // la informacion de la imagen que nosotros vamos a guardar en la API
    body: {
      decription: image.description,
      src: image.src,
      userId: image.userId
    }
    // Aqui se retorna la respuesta completa de request-promise y no solo
    // el body
    // resolveWithFullResponse: true
  }
  // Ejecutamos el request con las opciones
  // let response = await request(options)
  // // Probamos que el resultado sea igual a la imagen que yo obtengo de los
  // // fixtures y que tambien el response call sea el 201 que es realmente el HTTP
  // // Code que se utiliza el ASTTP semantico que indica que una entidad se ha creado
  // t.deepEqual(response.body, image)
  // // Verificamos que el status Code sea el 201 y que nos devuelva la imagen
  // // que se creo en la base de datos
  // t.is(response.statusCode, 201)

  // Vamos a implementar un test con la autentificacion con el token, throws espera
  // que la funcion o promesa que le pasemos, lance una excepcion, esto nos debe
  // de arrojar una excepcion de error en caso de no pasar un token correcto
  await t.throws(request(options), /invalid token/)
}) // Ruta de post para guardar una imagen

test('invalid token POST /', async (t) => {
  let image = fixtures.getImage()
  let url = t.context.url
  // Generamos un token pero un token malicioso pues hemos pasado un payload distinto
  // con esto simulamos que el token ha sido interceptado y manipulado
  let token = await utils.signToken({ userId: 'hacky' }, config.secret)

  let options = {
    method: 'POST',
    url: url,
    json: true,
    body: {
      decription: image.description,
      src: image.src,
      userId: image.userId
    },
    // Este seran los header que se le pasaran a el header de la
    // peticion HTTP
    headers: {
      'Authorization': `Bearer ${token}`
    },
    resolveWithFullResponse: true
  }
  await t.throws(request(options), /invalid token/)
})

test('POST /:id/like', async (t) => {
  let image = fixtures.getImage()
  let url = t.context.url
  let options = {
    method: 'POST',
    url: `${url}/${image.id}/like`,
    json: true
  }
  // Obtenemos el cuerpo del request el cual no queremos comprobar
  // la respuesta del servidor si no el objeto como tal
  let body = await request(options)
  // Para ello, clonamos la imagen con un metodo de JavaScript el cual
  // no es muy recomendable para los objetos grandes, para este ejemplo
  // todo esta bien, lo clonamos para poder modificarlo y no tener problema
  // con el contexto
  let imageNew = JSON.parse(JSON.stringify(image))
  // Ahora seteamos el clon como si se le hubiera dado like, esto para realizar
  // la comparacion posteriormente
  imageNew.liked = true
  imageNew.likes = 1
  // Con ello podemos comparar ambos objetos y ver si son iguales,
  // el de la "base de datos" y el clonado (seteado a proposito)
  t.deepEqual(body, imageNew)
}) // Ruta que se creara despues para cuando se le da like
// a la imagen

test('secure POST /', async (t) => {
  let image = fixtures.getImage()
  let url = t.context.url
  // Recordando que todas las funciones son asincronas y debemos
  // de resolver las promesas, le pasamos como payload el userId
  // y las llaves de JWT para realizar la autentificacion config.secret
  let token = await utils.signToken({ userId: image.userId }, config.secret)

  let options = {
    method: 'POST',
    url: url,
    json: true,
    body: {
      decription: image.description,
      src: image.src,
      userId: image.userId
    },
    // Este seran los header que se le pasaran a el header de la
    // peticion HTTP
    headers: {
      'Authorization': `Bearer ${token}`
    },
    resolveWithFullResponse: true
  }
  let response = await request(options)
  // Ahora ya no nos regresará una respuesta de falla
  t.is(response.statusCode, 201)
  // Por ultimo testeamos que el body y la imagen creada sean
  // las mismas
  t.deepEqual(response.body, image)
}) // Ruta de post para guardar una imagen

// Tener cuidado con tener colisiones de rutas pues al realizar el
// primer test, resulta que un valor era el objeto de nuestro primer
// metodo GET de estos test y el otro era un arreglo de objetos el cual
// se encuentra definido en este test y por tanto no son iguales
test('GET /list', async (t) => {
  let images = fixtures.getImages()
  let url = t.context.url

  let options = {
    method: 'GET',
    url: `${url}/list`,
    json: true
  }
  // Hacemos peticion a servidor con las opciones ya seteadas
  // y este nos debe de devolver la lista de imagenes que es implementada
  // en nuesto API
  let body = await request(options)
  // Con esto comparamos entre el body (que son las listas de imagenes),
  // comparamos los objetos de las listas de imagenes
  t.deepEqual(body, images)
})

test('POST /:id/like', async (t) => {
  let image = fixtures.getImage()
  let url = t.context.url
  let options = {
    method: 'POST',
    url: `${url}/${image.id}/like`,
    json: true
  }
  // Obtenemos el cuerpo del request el cual no queremos comprobar
  // la respuesta del servidor si no el objeto como tal
  let body = await request(options)
  // Para ello, clonamos la imagen con un metodo de JavaScript el cual
  // no es muy recomendable para los objetos grandes, para este ejemplo
  // todo esta bien, lo clonamos para poder modificarlo y no tener problema
  // con el contexto
  let imageNew = JSON.parse(JSON.stringify(image))
  // Ahora seteamos el clon como si se le hubiera dado like, esto para realizar
  // la comparacion posteriormente
  imageNew.liked = true
  imageNew.likes = 1
  // Con ello podemos comparar ambos objetos y ver si son iguales,
  // el de la "base de datos" y el clonado (seteado a proposito)
  t.deepEqual(body, imageNew)
}) // Ruta que se creara despues para cuando se le da like
// a la imagen

// Tener cuidado con tener colisiones de rutas pues al realizar el
// primer test, resulta que un valor era el objeto de nuestro primer
// metodo GET de estos test y el otro era un arreglo de objetos el cual
// se encuentra definido en este test y por tanto no son iguales
test('GET /list', async (t) => {
  let images = fixtures.getImages()
  let url = t.context.url

  let options = {
    method: 'GET',
    url: `${url}/list`,
    json: true
  }
  // Hacemos peticion a servidor con las opciones ya seteadas
  // y este nos debe de devolver la lista de imagenes que es implementada
  // en nuesto API
  let body = await request(options)
  // Con esto comparamos entre el body (que son las listas de imagenes),
  // comparamos los objetos de las listas de imagenes
  t.deepEqual(body, images)
})

test('GET /tag/:tag', async (t) => {
  let images = fixtures.getImagesByTag()
  let url = t.context.url
  // Creamos el objeto de opciones de la peticion
  // HTTP
  let options = {
    method: 'GET',
    url: `${url}/tag/awesome`,
    json: true
  }
  let body = await request(options)
  t.deepEqual(body, images)
})
