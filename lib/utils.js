'use strict'

// JWT funciona de dos formas, de manera sincrona y asincrona
// sin embargo la forma de asincronismo lo realiza utilizando
// callbacks
import jwt from 'jsonwebtoken'
import bearer from 'token-extractor'

// Aqui vamos a definir algunos metodos para nuestras
// pruebas de los JSON Web Tokens (JWT), vamos a verificar
// los tokens
export default {
  // Declaramos los metodos asincronos para poder utilizarlos
  // dentro de nuestro middleware asincrono con async await
  // Este metodo recibe tres parametros, payload es la informacion
  // que se va a enviar (encriptada), secret que es la llave secreta
  // que conoce solo el frontend y el backend y options que son opciones
  // que yo puedo pasar a la libreria de web token para poder setear el tipo
  // de algoritmo, si tiene alguna vigencia el token, etc
  async signToken (payload, secret, options) {
    // Creamos una nueva promesa utilizando la clase Promise que viene
    // nativa en ECMAScript2015
    return new Promise((resolve, reject) => {
      // Lo que vamos a realizar en esta promesa es recibir un payload de datos, lo
      // firmamos con un token y devolvemos el token
      /* Retorna un callback con el error o el token */
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) return reject(err)
        resolve(token)
      })
    })
  },
  // De la misma forma, metodo asincrono que recibe el token generado,
  // la llave que indica si puedo desencriptar y es un token valido y
  // las opciones para setear
  async verifyToken (token, secret, options) {
    // Lo que vamos a hacer es retornar el payload de informacion decodificado si el
    // token no es corrupto, para ello creamos una promesa que retornara un resolve
    // o un reject dependiendo de la respuesta de la verificacion de JWT
    return new Promise((resolve, reject) => {
      // Verificamos el token junto con la palabra secreta y retornamos un callback
      /* Callback que devuelve el error o el payload decodificado */
      jwt.verify(token, secret, options, (err, decoded) => {
        if (err) return reject(err)
        // Devolvemos el payload, que es el objeto decodificado
        resolve(decoded)
      })
    })
  },
  // ¿Como podemos compartir el token generado? Nosotros podemos compartir
  // el token generado como mas nos plazca sin embargo, existen estandares
  // que indican que podemos usar el header de autorizacion (header authorization)
  // que utiliza HTTP y por ese medio enviarlo o lo que es mejor conocido
  // como un bitter token.
  // ExtractToken es un metodo que se encarga de extraer el token de la cabecera
  async extractToken (req) {
    // Podriamos extraer el token desde el bearerheader com osigue:
    // Authorization: Bearer <token>, o bien utilizar token-extractor
    return new Promise((resolve, reject) => {
      // Mediante token-extractor podemos extraer el token del header HTTP
      bearer(req, (err, token) => {
        if (err) return reject(err)
        resolve(token)
      })
    })
  }
}
