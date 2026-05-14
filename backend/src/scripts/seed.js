require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const Estacion = require('../models/Estacion')

const estacionesSeed = [
  // San Pedro Garza García
  { cre_id: 'SP001', nombre: 'PETROMAX Vasconcelos', razon_social: 'PETROMAX S.A. DE C.V.', calle: 'Av. José Vasconcelos', numero_exterior: '1200', colonia: 'Valle Oriente', municipio: 'SAN PEDRO GARZA GARCIA', location: { type: 'Point', coordinates: [-100.3721, 25.6432] }, precios: { magna: 22.85, premium: 24.90, diesel: 23.95 }, ultima_actualizacion: new Date() },
  { cre_id: 'SP002', nombre: 'Gasolinera Bosques del Valle', razon_social: 'SERVICIOS GASOLINEROS DE MEXICO', calle: 'Blvd. Antonio L. Rodríguez', numero_exterior: '3000', colonia: 'Bosques del Valle', municipio: 'SAN PEDRO GARZA GARCIA', location: { type: 'Point', coordinates: [-100.3842, 25.6589] }, precios: { magna: 22.79, premium: 24.79, diesel: 23.89 }, ultima_actualizacion: new Date() },
  { cre_id: 'SP003', nombre: 'ORSAN DEL NORTE Díaz Ordaz', razon_social: 'ORSAN DEL NORTE S.A. DE C.V.', calle: 'Blvd. Luis Díaz Ordaz', numero_exterior: '500', colonia: 'Del Valle', municipio: 'SAN PEDRO GARZA GARCIA', location: { type: 'Point', coordinates: [-100.3950, 25.6510] }, precios: { magna: 23.15, premium: 25.10, diesel: 24.20 }, ultima_actualizacion: new Date() },
  { cre_id: 'SP004', nombre: 'Gasolinera San Agustín', razon_social: 'COMBUSTIBLES SAN AGUSTIN', calle: 'Av. Lázaro Cárdenas', numero_exterior: '900', colonia: 'San Agustín', municipio: 'SAN PEDRO GARZA GARCIA', location: { type: 'Point', coordinates: [-100.3680, 25.6350] }, precios: { magna: 22.99, premium: 24.99, diesel: 24.05 }, ultima_actualizacion: new Date() },
  { cre_id: 'SP005', nombre: 'PETROMAX Calzada del Valle', razon_social: 'PETROMAX S.A. DE C.V.', calle: 'Calzada del Valle', numero_exterior: '400', colonia: 'Del Valle', municipio: 'SAN PEDRO GARZA GARCIA', location: { type: 'Point', coordinates: [-100.3800, 25.6478] }, precios: { magna: 23.05, premium: 24.95, diesel: 24.10 }, ultima_actualizacion: new Date() },
  { cre_id: 'SP006', nombre: 'Gasolinera Carretera Nac.', razon_social: 'HIDRO CARBURANTES NL', calle: 'Carretera Nacional', numero_exterior: '1500', colonia: 'La Estanzuela', municipio: 'SAN PEDRO GARZA GARCIA', location: { type: 'Point', coordinates: [-100.4010, 25.6300] }, precios: { magna: 22.70, premium: 24.75, diesel: 23.80 }, ultima_actualizacion: new Date() },
  // Santa Catarina
  { cre_id: 'SC001', nombre: 'Gasolinera Santa Catarina', razon_social: 'GASOLINERA SANTA CATARINA S.A. DE C.V.', calle: 'Carretera Libre Monterrey-Saltillo', numero_exterior: 'KM 12', colonia: 'Centro', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4590, 25.6750] }, precios: { magna: 22.90, premium: 24.85, diesel: 23.92 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC002', nombre: 'PETROMAX Santa Catarina', razon_social: 'PETROMAX S.A. DE C.V.', calle: 'Av. Benito Juárez', numero_exterior: '200', colonia: 'Centro', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4720, 25.6820] }, precios: { magna: 22.75, premium: 24.72, diesel: 23.79 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC003', nombre: 'Gasolinera Las Puentes', razon_social: 'COMBUSTIBLES LAS PUENTES', calle: 'Av. Las Puentes', numero_exterior: '1800', colonia: 'Las Puentes', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4398, 25.6901] }, precios: { magna: 23.20, premium: 25.15, diesel: 24.25 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC004', nombre: 'Gasolinera Real de Santa Catarina', razon_social: 'SERVICIO REAL SC S.A. DE C.V.', calle: 'Blvd. Fundadores', numero_exterior: '3400', colonia: 'Real de Santa Catarina', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4650, 25.6690] }, precios: { magna: 22.65, premium: 24.70, diesel: 23.75 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC005', nombre: 'Gasolinera Ensenada', razon_social: 'HIDRO COMBUSTIBLES ENSENADA', calle: 'Av. Ensenada', numero_exterior: '500', colonia: 'Valle de Santa Catarina', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4820, 25.6760] }, precios: { magna: 23.35, premium: 25.25, diesel: 24.35 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC006', nombre: 'PETROMAX Carretera Nacional', razon_social: 'PETROMAX S.A. DE C.V.', calle: 'Carretera Nacional', numero_exterior: 'KM 18', colonia: 'El Uro', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.5010, 25.6610] }, precios: { magna: 22.60, premium: 24.65, diesel: 23.70 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC007', nombre: 'Gasolinera Portal de Santa Catarina', razon_social: 'PORTAL COMBUSTIBLES S.A.', calle: 'Av. Industrias', numero_exterior: '900', colonia: 'Portal de Santa Catarina', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4480, 25.6970] }, precios: { magna: 22.95, premium: 24.92, diesel: 24.00 }, ultima_actualizacion: new Date() },
  { cre_id: 'SC008', nombre: 'Gasolinera Libramiento', razon_social: 'LIBRAMIENTO COMBUSTIBLES NL', calle: 'Libramiento Poniente', numero_exterior: '2200', colonia: 'Fracc. San Jerónimo', municipio: 'SANTA CATARINA', location: { type: 'Point', coordinates: [-100.4920, 25.6850] }, precios: { magna: 22.55, premium: 24.60, diesel: 23.65 }, ultima_actualizacion: new Date() },
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB conectado')
  await Estacion.deleteMany({})
  console.log('Colección limpiada')
  await Estacion.insertMany(estacionesSeed)
  console.log(`✅ ${estacionesSeed.length} estaciones sembradas`)
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
