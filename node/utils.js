import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { create } from 'xmlbuilder2' // For creating XML

import { __dirname } from './dirname.js'

// Scan directory for HTML files
// export const scanHtmlFiles = directory => {
//   const htmlFiles = []

//   try {
//     const files = fs.readdirSync(directory, { recursive: true })

//     for (const file of files) {
//       if (path.extname(file).toLowerCase() === '.html') {
//         htmlFiles.push(path.join(directory, file))
//       }
//     }
//   } catch (error) {
//     console.error(`Error scanning directory: ${error.message}`)
//   }

//   return htmlFiles
// }
export const scanHtmlFiles = (directory, options = {}) => {
  const htmlFiles = []
  const { pathsToExclude = [] } = options

  try {
    const files = fs.readdirSync(directory, { recursive: true })

    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.html') {
        // Get the full path
        const fullPath = path.join(directory, file)

        // Get relative path by removing the base directory
        // and normalize it to use forward slashes for consistency
        let relPath = file.split(path.sep).join('/')

        // Ensure the path starts with a forward slash for matching
        if (!relPath.startsWith('/')) {
          relPath = '/' + relPath
        }

        // Check if this path should be excluded
        const shouldExclude = pathsToExclude.some(pattern => {
          // Exact path match
          if (pattern === relPath) {
            return true
          }

          // Root directory match
          if (pattern === '/' && !relPath.substring(1).includes('/')) {
            return true
          }

          // Wildcard pattern (directory/*)
          if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -1) // Remove the *
            return relPath.startsWith(prefix)
          }

          return false
        })

        if (!shouldExclude) {
          htmlFiles.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory: ${error.message}`)
  }

  return htmlFiles
}

// Find source files directory from the rss generator
export const getDirectory = (...pathPartsToFiles) => {
  return path.join(__dirname, ...pathPartsToFiles)
}

const extractItemsAfterRoot = (arr, root) => {
  const srcIndex = arr.indexOf(root)
  return srcIndex === -1 ? [] : arr.slice(srcIndex + 1)
}

// Extract metadata from HTML file
export const extractMetadata = (filePath, options) => {
  const baseUrl = options.feed.link

  try {
    // Read the HTML file
    const html = fs.readFileSync(filePath, 'utf8')

    // Load HTML into cheerio
    const $ = cheerio.load(html)

    // Extract metadata
    const title = $('title').text() || path.basename(filePath, '.html')
    const description =
      $('meta[name="description"]').attr('content') ||
      $('p').first().text().substring(0, 160) ||
      'No description available'

    // Get publication date - first look for meta tag, fallback to file stats
    let pubDate =
      $('meta[name="date"]').attr('content') ||
      $('meta[property="article:published_time"]').attr('content')

    if (!pubDate) {
      // Fallback to file modification date
      const stats = fs.statSync(filePath)
      pubDate = stats.mtime
    } else {
      pubDate = new Date(pubDate)
    }

    // Format the date as required by RSS (RFC 822)
    const formattedDate = pubDate.toUTCString()

    // Generate link from file path and base URL
    const relativePath = path.basename(filePath, '.html')
    const parts = path.parse(filePath)?.dir?.split('/')
    const suffix = extractItemsAfterRoot(parts, options.root)
    const ancestors = suffix.join('/')
    const link = new URL(ancestors + '/' + relativePath, baseUrl).toString()

    // Use file path as guid (could be more sophisticated in production)
    const guid = link

    return {
      title,
      link,
      description,
      pubDate: formattedDate,
      guid,
    }
  } catch (error) {
    console.error(
      `Error extracting metadata from ${filePath}: ${error.message}`
    )
    return null
  }
}

// Generate RSS XML
export const generateRssXml = (items, options) => {
  // Create the RSS document
  const rss = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss')
    .att('version', '2.0')
    .att('xmlns:atom', 'http://www.w3.org/2005/Atom')
    .ele('channel')
    .ele('atom:link')
    .att('href', options.feed.link)
    .att('rel', 'self')
    .att('type', 'application/rss+xml')
    .up()
    .ele('title')
    .txt(options.feed.title)
    .up()
    .ele('link')
    .txt(options.feed.link)
    .up()
    .ele('image')
    .ele('url')
    .txt(options.images.main)
    .up()
    .ele('title')
    .txt(options.feed.title)
    .up()
    .ele('link')
    .txt(options.feed.link)
    .up()
    .up()
    .ele('description')
    .txt(options.feed.description)
    .up()
    .ele('lastBuildDate')
    .txt(new Date().toUTCString())
    .up()
    .ele('language')
    .txt('en')
    .up()

  // Add each item to the channel
  items.forEach(item => {
    rss
      .ele('item')
      .ele('title')
      .txt(item.title)
      .up()
      .ele('link')
      .txt(item.link)
      .up()
      .ele('description')
      .dat(`<img src="${options.images.main}"/>${item.description}`)
      .up()
      .ele('pubDate')
      .txt(item.pubDate)
      .up()
      .ele('guid')
      .txt(item.guid)
      .up()
  })

  // Convert to XML string with pretty formatting
  return rss.end({ prettyPrint: true })
}
