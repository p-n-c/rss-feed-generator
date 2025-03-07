import { generateRssFeed } from './rss-generator.js'
import { getDirectory } from './utils.js'

const src = getDirectory('..', 'src')
const options = {
  root: 'src',
  images: {
    main: 'https://lh3.googleusercontent.com/d/1bo6LEU0O-LmkIooNKcLMzyxqqfSxJ4tz?authuser=0',
  },
  pathsToExclude: ['/'],
  feed: {
    title: 'People and Code, At Your Disposal',
    link: 'https://the-public-good.com/',
    description: 'Latest articles from People and Code',
    outputPath: 'feed.rss',
  },
}

generateRssFeed(src, options)
