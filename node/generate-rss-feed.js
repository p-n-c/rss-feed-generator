import { generateRssFeed } from './rss-generator.js'
import { getDirectory } from './utils.js'

const src = getDirectory('..', 'src')
const options = {
  root: 'src',
  images: {
    main: 'https://lh3.googleusercontent.com/d/1bo6LEU0O-LmkIooNKcLMzyxqqfSxJ4tz?authuser=0',
  },
}

generateRssFeed(src, options)
