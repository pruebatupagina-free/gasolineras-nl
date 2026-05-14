require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const { sincronizarPrecios } = require('../crons/syncCRE')

async function run() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB conectado')
  await sincronizarPrecios()
  await mongoose.disconnect()
  console.log('Sincronización manual completada')
}

run().catch(err => { console.error(err); process.exit(1) })
