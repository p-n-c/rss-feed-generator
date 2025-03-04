import fs from 'fs'
import {
  scanHtmlFiles,
  extractMetadata,
  generateRssXml,
  feedOptions,
} from './utils.js'

export const generateRssFeed = async src => {
  // 1. Scan for HTML files
  const htmlFiles = scanHtmlFiles(src)

  // 2. Extract metadata from each file
  const items = []
  for (const file of htmlFiles) {
    const metadata = extractMetadata(file, feedOptions.link)
    if (metadata) {
      items.push(metadata)
    }
  }

  // 3. Generate XML feed
  const rssXml = generateRssXml(feedOptions, items)

  // 4. Save RSS feed to file
  fs.writeFileSync(feedOptions.outputPath, rssXml)
}

// Publicly available functions
export const rssFeeder = {
  generateRssFeed,
}
