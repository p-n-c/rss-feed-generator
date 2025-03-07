import fs from 'fs'
import { scanHtmlFiles, extractMetadata, generateRssXml } from './utils.js'

export const generateRssFeed = async (src, options) => {
  // 1. Scan for HTML files
  const htmlFiles = scanHtmlFiles(src, options)

  // 2. Extract metadata from each file
  const items = []
  for (const file of htmlFiles) {
    const metadata = extractMetadata(file, options)
    if (metadata) {
      items.push(metadata)
    }
  }
  // 3. Generate XML feed
  const rssXml = generateRssXml(items, options)

  // 4. Save RSS feed to file
  fs.writeFileSync(options.feed.outputPath, rssXml)
}

// Publicly available functions
export const rssFeeder = {
  generateRssFeed,
}
