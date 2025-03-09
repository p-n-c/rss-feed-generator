import { generateRssFeed } from './rss-generator.js'
import { getDirectory } from './utils.js'

const src = getDirectory('..', 'src')
const root = 'src'
const feed = {
  title: 'People and Code, At Your Disposal',
  link: 'https://people-and-code/',
  description: 'Latest articles from People and Code',
  outputPath: 'feed.rss',
}
const options = {
  images: {
    main: 'https://lh3.googleusercontent.com/d/1bo6LEU0O-LmkIooNKcLMzyxqqfSxJ4tz?authuser=0',
  },
  pathsToExclude: ['/'],
}

generateRssFeed(src, root, feed, options)
