import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUTPUT_DIR = path.resolve('../../public/images/services')

const services = [
  {
    id: 'blindagem-capilar',
    name: 'Blindagem Capilar',
    prompt: 'Professional hair treatment salon, woman with healthy shiny hair after protein treatment, soft lighting, beauty photography, 1024x1024'
  },
  {
    id: 'acidificacao-capilar',
    name: 'Acidificação Capilar',
    prompt: 'Hair acid treatment close up, professional hair care, shiny smooth hair, salon environment, 1024x1024'
  },
  {
    id: 'botox-capilar',
    name: 'Botox Capilar Orgânico',
    prompt: 'Organic botox hair treatment, woman with voluminous healthy hair, natural beauty, salon lighting, 1024x1024'
  },
  {
    id: 'espelhamento-3d',
    name: 'Espelhamento 3D',
    prompt: '3D hair mirror treatment, professional hair styling, silky smooth hair, modern salon, 1024x1024'
  },
  {
    id: 'selante-capilar',
    name: 'Selante Capilar Blond',
    prompt: 'Blonde hair sealing treatment, woman with beautiful blonde hair, hair care close up, 1024x1024'
  },
  {
    id: 'progressiva',
    name: 'Progressiva Orgânica',
    prompt: 'Organic hair straightening treatment, woman with smooth straight hair, professional salon, 1024x1024'
  },
  {
    id: 'progressiva-formal',
    name: 'Progressiva Formal',
    prompt: 'Formal hair straightening, woman with silky straight hair, hair transformation before and after, 1024x1024'
  },
  {
    id: 'megahair-invisible',
    name: 'Invisible Weft Extensions',
    prompt: 'Invisible hair extensions, woman with long voluminous hair, professional megahair, salon, 1024x1024'
  },
  {
    id: 'megahair-microcapsula',
    name: 'Micro Cápsula de Queratina',
    prompt: 'Micro keratin capsule hair treatment, woman with beautiful hair extensions, professional application, 1024x1024'
  },
  {
    id: 'megahair-fita',
    name: 'Invisible Hair Extensions Fita',
    prompt: 'Tape hair extensions, woman with long natural-looking hair, modern hair extension technique, 1024x1024'
  },
  {
    id: 'cronograma-capilar',
    name: 'Cronograma Capilar',
    prompt: 'Hair treatment routine, woman with healthy hair in salon, multiple hair treatments, 1024x1024'
  }
]

const categoryImages = [
  {
    id: 'tratamentos-destaque',
    name: 'Tratamentos e Alinhamento',
    prompt: 'Hair treatment salon banner, various hair treatments displayed, woman with beautiful hair, elegant pink color scheme, 1344x768'
  },
  {
    id: 'alisamento-destaque',
    name: 'Alisamento',
    prompt: 'Hair straightening salon banner, professional hair straightening, woman with smooth straight hair, elegant pink theme, 1344x768'
  },
  {
    id: 'extensions-destaque',
    name: 'Extensões / Mega Hair',
    prompt: 'Hair extensions salon banner, woman with long voluminous hair extensions, professional megahair, elegant pink, 1344x768'
  },
  {
    id: 'cronograma-destaque',
    name: 'Cronograma Capilar + Blindagem',
    prompt: 'Hair care routine banner, complete hair treatment program, woman with healthy shiny hair, pink salon theme, 1344x768'
  }
]

async function generateImage(prompt, size, outputPath) {
  console.log(`Generating: ${outputPath}`)

  try {
    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt,
      size
    })

    if (response.data && response.data[0] && response.data[0].base64) {
      const imageBase64 = response.data[0].base64
      const buffer = Buffer.from(imageBase64, 'base64')
      fs.writeFileSync(outputPath, buffer)
      console.log(`✓ Generated: ${outputPath}`)
      return true
    } else {
      console.error(`✗ Failed: ${outputPath} - No image data in response`)
      return false
    }
  } catch (error) {
    console.error(`✗ Error generating ${outputPath}:`, error.message)
    return false
  }
}

async function generateAllImages() {
  console.log('Starting image generation...')
  console.log('================================')

  const results = {
    services: [],
    categories: []
  }

  // Generate service images (square 1024x1024)
  console.log('\n📸 Generating service images (1024x1024)...')
  for (const service of services) {
    const outputPath = path.join(OUTPUT_DIR, `${service.id}.png`)
    const success = await generateImage(service.prompt, '1024x1024', outputPath)
    results.services.push({ ...service, success, path: outputPath })
    await new Promise(resolve => setTimeout(resolve, 2000)) // Delay between requests
  }

  // Generate category images (landscape 1344x768)
  console.log('\n📸 Generating category images (1344x768)...')
  for (const category of categoryImages) {
    const outputPath = path.join(OUTPUT_DIR, `${category.id}.png`)
    const success = await generateImage(category.prompt, '1344x768', outputPath)
    results.categories.push({ ...category, success, path: outputPath })
    await new Promise(resolve => setTimeout(resolve, 2000)) // Delay between requests
  }

  console.log('\n================================')
  console.log('Summary:')
  console.log(`Services: ${results.services.filter(r => r.success).length}/${results.services.length} successful`)
  console.log(`Categories: ${results.categories.filter(r => r.success).length}/${results.categories.length} successful`)
  console.log('================================')

  return results
}

generateAllImages().then(results => {
  console.log('\n✓ Image generation completed!')
}).catch(error => {
  console.error('✗ Fatal error:', error)
  process.exit(1)
})
