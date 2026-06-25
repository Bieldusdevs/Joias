import { defineField, defineType } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (Rule) => Rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'price', title: 'Price in EUR', type: 'number', validation: (Rule) => Rule.required().positive() }),
    defineField({ name: 'image', title: 'Product Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'materials', title: 'Materials', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'stripePriceId', title: 'Stripe Price ID', type: 'string' }),
    defineField({ name: 'order', title: 'Editorial Order', type: 'number' })
  ]
})
