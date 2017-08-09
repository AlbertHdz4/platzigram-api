'use strict'

import test from 'ava'
import micro from 'micro'
import listen from 'test-listen'
import request from 'request-promise'
import fixtures from './fixtures/'
import auth from '../auth'
import config from '../config'
import utils from '../lib/utils'

test.beforeEach(async (t) => {
  let srv = micro(auth)
  t.context.url = await listen(srv)
})

test('success POST /', async (t) => {
  let user = fixtures.getUser()
  let url = t.context.url
  // Configuramos las opciones para poder realizar la
  // autentificacion de usuario
  let options = {
    method: 'POST',
    url: url,
    body: {
      username: user.username,
      password: user.password
    },
    json: true
  }
  // Lo que nos va a retornar es un token
  let token = await request(options)
  // Decodificamos el y verificamos el token
  let decoded = await utils.verifyToken(token, config.secret)
  t.deepEqual(decoded.username, user.username)
  t.is(decoded.username, user.username)
})
