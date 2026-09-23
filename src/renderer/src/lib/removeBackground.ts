import { removeBackground as removeBackgroundImpl } from '@imgly/background-removal'

// Runs entirely on-device via WebAssembly — no image data is ever sent
// anywhere. The only network activity is a one-time download (per machine)
// of the open-source ML model itself, cached by the browser afterward.
export async function removeBackground(
  imageUrl: string,
  onProgress?: (fraction: number) => void
): Promise<Blob> {
  return removeBackgroundImpl(imageUrl, {
    model: 'isnet_quint8',
    output: { format: 'image/png' },
    progress: onProgress
      ? (_key: string, current: number, total: number) =>
          onProgress(total > 0 ? current / total : 0)
      : undefined
  })
}
