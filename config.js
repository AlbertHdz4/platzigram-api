// Este documento establece la configuracion de la base de datos
// por ahora ya que realizamos el test, esta base de datos tendrá la
// configuracion por default (que hemos configurado en el servidor)
// pero ya en produccion, vamos a establecer ciertos parametros de a que
// base de datos se van a conectar, etc.
export default {
  db: {},
  // Vamos a crear una nueva variable de entorno para realizar el proceso
  // de autentificacion y tener cuidado cuando se mande a produccion o bien que
  // no se tenga quemada la informacion en un pedazo de codigo
  secret: process.env.PLATZIGRAM_SECRET || 'pl4tzi' // No usar defaults pues esto es una pieza clave de la autentificacion
}
