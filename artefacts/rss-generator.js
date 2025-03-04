// File: rss-generator.js

import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio' // For parsing HTML
import { create } from 'xmlbuilder2' // For creating XML

// Function to scan directory for HTML files
function scanHtmlFiles(directory) {
  const htmlFiles = []

  try {
    const files = fs.readdirSync(directory)

    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.html') {
        htmlFiles.push(path.join(directory, file))
      }
    }
  } catch (error) {
    console.error(`Error scanning directory: ${error.message}`)
  }

  return htmlFiles
}

// Function to extract metadata from HTML file
function extractMetadata(filePath, baseUrl) {
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
    const link = new URL(relativePath, baseUrl).toString()

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

// Function to generate RSS XML
function generateRssXml(feedOptions, items) {
  // Create the RSS document
  const rss = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', { version: '2.0' })
    .ele('channel')
    .ele('title')
    .txt(feedOptions.title)
    .up()
    .ele('link')
    .txt(feedOptions.link)
    .up()
    .ele('description')
    .txt(feedOptions.description)
    .up()
    .ele('lastBuildDate')
    .txt(new Date().toUTCString())
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
      .txt(item.description)
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

// Main function to generate RSS feed
async function generateRssFeed(directory, feedOptions) {
  // 1. Scan for HTML files
  const htmlFiles = scanHtmlFiles(directory)
  console.log(`Found ${htmlFiles.length} HTML files`)

  // 2. Extract metadata from each file
  const items = []
  for (const file of htmlFiles) {
    const metadata = extractMetadata(file, feedOptions.link)
    if (metadata) {
      items.push(metadata)
    }
  }

  console.log(`Extracted metadata from ${items.length} files`)

  // 3. Generate XML feed
  const rssXml = generateRssXml(feedOptions, items)

  // 4. Save RSS feed to file
  fs.writeFileSync(feedOptions.outputPath, rssXml)
  console.log(`RSS feed saved to ${feedOptions.outputPath}`)
}

// Call the generator function
generateRssFeed('./content', feedOptions)

// To run this script:
// 1. npm init -y
// 2. Add "type": "module" to package.json
// 3. npm install cheerio xmlbuilder2
// 4. node rss-generator.js
