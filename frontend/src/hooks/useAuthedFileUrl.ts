import { useEffect, useState } from 'react'
import { fetchFileBlob } from '../api/files'

export function useAuthedFileUrl(fileId: number | null): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (fileId === null) return
    let cancelled = false
    let objectUrl: string | null = null

    fetchFileBlob(fileId).then(url => {
      if (cancelled) {
        URL.revokeObjectURL(url)
        return
      }
      objectUrl = url
      setBlobUrl(url)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileId])

  return blobUrl
}
