import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'https://pruebatupagina-free.github.io/gasolineras-nl'
const distDir  = join(process.cwd(), 'dist')

const ESTADOS = [
  { slug: 'aguascalientes',      nombre: 'Aguascalientes',      value: 'AGUASCALIENTES'      },
  { slug: 'baja-california',     nombre: 'Baja California',     value: 'BAJA CALIFORNIA'     },
  { slug: 'baja-california-sur', nombre: 'Baja California Sur', value: 'BAJA CALIFORNIA SUR' },
  { slug: 'campeche',            nombre: 'Campeche',            value: 'CAMPECHE'            },
  { slug: 'chiapas',             nombre: 'Chiapas',             value: 'CHIAPAS'             },
  { slug: 'chihuahua',           nombre: 'Chihuahua',           value: 'CHIHUAHUA'           },
  { slug: 'ciudad-de-mexico',    nombre: 'Ciudad de México',    value: 'CIUDAD DE MEXICO'    },
  { slug: 'coahuila',            nombre: 'Coahuila',            value: 'COAHUILA'            },
  { slug: 'colima',              nombre: 'Colima',              value: 'COLIMA'              },
  { slug: 'durango',             nombre: 'Durango',             value: 'DURANGO'             },
  { slug: 'guanajuato',          nombre: 'Guanajuato',          value: 'GUANAJUATO'          },
  { slug: 'guerrero',            nombre: 'Guerrero',            value: 'GUERRERO'            },
  { slug: 'hidalgo',             nombre: 'Hidalgo',             value: 'HIDALGO'             },
  { slug: 'jalisco',             nombre: 'Jalisco',             value: 'JALISCO'             },
  { slug: 'estado-de-mexico',    nombre: 'Estado de México',    value: 'ESTADO DE MEXICO'    },
  { slug: 'michoacan',           nombre: 'Michoacán',           value: 'MICHOACAN'           },
  { slug: 'morelos',             nombre: 'Morelos',             value: 'MORELOS'             },
  { slug: 'nayarit',             nombre: 'Nayarit',             value: 'NAYARIT'             },
  { slug: 'nuevo-leon',          nombre: 'Nuevo León',          value: 'NUEVO LEON'          },
  { slug: 'oaxaca',              nombre: 'Oaxaca',              value: 'OAXACA'              },
  { slug: 'puebla',              nombre: 'Puebla',              value: 'PUEBLA'              },
  { slug: 'queretaro',           nombre: 'Querétaro',           value: 'QUERETARO'           },
  { slug: 'quintana-roo',        nombre: 'Quintana Roo',        value: 'QUINTANA ROO'        },
  { slug: 'san-luis-potosi',     nombre: 'San Luis Potosí',     value: 'SAN LUIS POTOSI'     },
  { slug: 'sinaloa',             nombre: 'Sinaloa',             value: 'SINALOA'             },
  { slug: 'sonora',              nombre: 'Sonora',              value: 'SONORA'              },
  { slug: 'tabasco',             nombre: 'Tabasco',             value: 'TABASCO'             },
  { slug: 'tamaulipas',          nombre: 'Tamaulipas',          value: 'TAMAULIPAS'          },
  { slug: 'tlaxcala',            nombre: 'Tlaxcala',            value: 'TLAXCALA'            },
  { slug: 'veracruz',            nombre: 'Veracruz',            value: 'VERACRUZ'            },
  { slug: 'yucatan',             nombre: 'Yucatán',             value: 'YUCATAN'             },
  { slug: 'zacatecas',           nombre: 'Zacatecas',           value: 'ZACATECAS'           },
]

const template = readFileSync(join(distDir, 'index.html'), 'utf8')

for (const e of ESTADOS) {
  const title     = `Precio Gasolina ${e.nombre} | GasMap — Magna, Premium y Diésel`
  const desc      = `Compara precios de gasolina en ${e.nombre}. Encuentra la gasolinera más barata cerca de ti. Magna, Premium y Diésel con datos oficiales CRE. Actualización diaria.`
  const canonical = `${BASE_URL}/${e.slug}/`
  const jsonLd    = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonical,
    description: desc,
    inLanguage: 'es-MX',
    about: {
      '@type': 'State',
      name: e.nombre,
      containedInPlace: { '@type': 'Country', name: 'México' },
    },
    isPartOf: { '@type': 'WebApplication', name: 'GasMap', url: `${BASE_URL}/` },
  })

  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,           `$1${desc}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,                 `$1${canonical}$2`)
    .replace(/(<meta property="og:url"\s+content=")[^"]*(")/,         `$1${canonical}$2`)
    .replace(/(<meta property="og:title"\s+content=")[^"]*(")/,       `$1${title}$2`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*(")/,  `$1${desc}$2`)
    .replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/,       `$1${title}$2`)
    .replace(/(<meta name="twitter:description"\s+content=")[^"]*(")/,  `$1${desc}$2`)
    .replace(
      '</head>',
      `  <script>window.__GASMAP_ESTADO__="${e.value}"</script>\n  <script type="application/ld+json">${jsonLd}</script>\n</head>`
    )

  const outDir = join(distDir, e.slug)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'index.html'), html, 'utf8')
  process.stdout.write(`✓ /${e.slug}/\n`)
}

process.stdout.write(`\n✅ ${ESTADOS.length} páginas de estado generadas en dist/\n`)
