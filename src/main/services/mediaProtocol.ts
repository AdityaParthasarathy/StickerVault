import { net, protocol } from 'electron'
import { basename, join } from 'path'
import { pathToFileURL } from 'url'
import { paths } from './paths'

export const MEDIA_SCHEME = 'stickervault-media'

const ROOTS: Record<string, string> = {
  originals: paths.originalsDir,
  thumbnails: paths.thumbnailsDir
}

// The renderer can never see real filesystem paths — it only ever asks for
// URLs like `stickervault-media://thumbnails/<id>.png`. This must be called
// before `app.whenReady()`.
export function registerMediaSchemeAsPrivileged(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
    }
  ])
}

// Must be called after `app.whenReady()`.
export function registerMediaProtocolHandler(): void {
  protocol.handle(MEDIA_SCHEME, (request) => {
    const url = new URL(request.url)
    // `stickervault-media://thumbnails/abc.png` parses with host "thumbnails"
    // and pathname "/abc.png".
    const root = ROOTS[url.hostname]
    if (!root) {
      return new Response('Unknown media root', { status: 404 })
    }

    // `basename` strips any directory separators the requested filename
    // might contain, so a crafted request can't escape the folder (e.g.
    // "../../secrets.txt").
    const safeFileName = basename(decodeURIComponent(url.pathname))
    const filePath = join(root, safeFileName)

    return net.fetch(pathToFileURL(filePath).toString())
  })
}
