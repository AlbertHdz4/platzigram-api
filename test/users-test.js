'use strict'

import test from 'ava'
import micro from 'micro'
// import uuid from 'uuid-base62'
import listen from 'test-listen'
import request from 'request-promise'
import fixtures from './fixtures/'
// Importamos el microservicio de usuarios para poder
// realizar nuestros test
import users from '../users'
// Con ayuda de beforeEach creamos el microservicio antes de cada test
test.beforeEach(async (t) => {
  // Creamos un servidor con este microservicio
  let srv = micro(users)
  t.context.url = await listen(srv)
})

// Test con ruta para almacenar usuario, se guardará el usuario
// a la hora de hacer sign up cuando nos registremos en el sitio
test('POST /', async (t) => {
  // Obtenermos un usuario de los fixtures (datos de prueba basicos)
  // Los fixtures nos ayudan a garantizar que la ruta exista y que nos
  // devuelva los datos que nosotros queremos
  let user = fixtures.getUser()
  let url = t.context.url
  let options = {
    method: 'POST',
    // Definimos la url que es la que tenemos en este microservicio
    url: `${url}`,
    json: true,
    // Definimos el body o cuerpo del usuario con el que yo voy a hacer
    // el registro a la peticion HTTP, con esto estamos simulando
    // un registro de usuario (signup) en nuestra API
    body: {
      name: user.name,
      email: user.email,
      password: user.password
    },
    // Para poder verificar si esto esta repondiendo correctamente con
    // el codigo http (codigo de status) vamos a decir que resuelva la
    // promesa con toda la respuesta, la cual es una propiedad de request
    // Promise
    resolveWithFullResponse: true
  }

  let response = await request(options)

  // Aqui hay otro tema super importante en cuestion de seguridad, lo que sucede es
  // que nosotros no queremos que nuestro modulo API nos retorne los valores de email
  // y password ya que para nosotros esta informacion es crucial para mantener la
  // integridad de los datos, para ello borraremos en el test, los campos de email
  // y el de password como se muestra a continuacion
  delete user.email
  delete user.password

  // Verificamos que el statusCode sea el 201
  t.is(response.statusCode, 201)
  // Vemos que el body o cuerpo del usuario sea igual
  // al user
  t.deepEqual(response.body, user)
})
// Ruta de obtener el usuario cuando queramos obtener la informacion
// para obtener el usuario de la base de datos
test('GET /:username', async (t) => {
  let user = fixtures.getUser()
  let url = t.context.url
  let options = {
    method: 'GET',
    url: `${url}/${user.username}`,
    json: true
  }
  // Recordar que request retorna una promesa pues
  // estamos trabajando con funciones asincronas
  let body = await request(options)
  delete user.email
  delete user.password
  t.deepEqual(body, user)
})
