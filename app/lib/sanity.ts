import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-06-25',
  useCdn: true
})

export const productsQuery = `*[_type == "product"] | order(order asc) {
  _id,
  name,
  category,
  price,
  description,
  materials,
  "image": image.asset->url,
  stripePriceId
}`
