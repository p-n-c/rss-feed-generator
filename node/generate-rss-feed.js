import { generateRssFeed } from './rss-generator.js'
import { getDirectory } from './utils.js'

const src = getDirectory('..', 'src')

generateRssFeed(src)
