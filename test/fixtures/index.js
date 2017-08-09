// Como lo hicimos en la implementacion de platzigram-db
// con este archivo estamos simulando una imagen para que
// nuestro API la consuma
export default {
  getImage () {
    // Simplemente retornamos un objeto que suponemos viene de la base
    // de datos y posteriormente lo retornamos en el test
    return {
      id: 'e6290d08-1bdb-4b9e-b274-79fc92baf5d2',
      publicId: '70iZIMZwiRob72KpKxpO5c',
      userId: 'platzigram',
      liked: false,
      likes: 0,
      // Ubicacion de la imagen en S3
      src: 'http://platzigram.test/70iZIMZwiRob72KpKxpO5c.jpg',
      description: '#awesome',
      tags: [ 'awesome' ],
      createdAt: new Date().toString()
    }
  },
  // Simulamos que obtenemos tres imagenes solo por motivos de pruebas
  // no nos importa una integridad de base de datos pues esto ya lo hicimos
  // en nuestro modulo Platzigram-db
  getImages () {
    return [
      this.getImage(),
      this.getImage(),
      this.getImage()
    ]
  },
  getImagesByTag () {
    return [
      this.getImage(),
      this.getImage()
    ]
  },
  getUser () {
    return {
      id: 'a2903304-426b-4214-acc3-3be881bd7895',
      name: 'Freddy Vega',
      username: 'freddier',
      email: 'f@platzi.test',
      // En este caso utilizaremos el password en texto plano, pues primero
      // tenemos que hacer el sign up y enviar el password antes de encriptarlo
      password: 'pl4tzi',
      // Y una fecha de creacion del objeto
      createdAt: new Date().toString()
    }
  }
}
