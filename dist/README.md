# Simple RSS feed generator

Example

```javascript
import path from 'path'
const __dirname = import.meta.dirname

import { rssFeeder } from '@p-n-c/rssfeed'

const src = path.join(__dirname, 'src')

rssFeeder.generateRssFeed(src)
```
