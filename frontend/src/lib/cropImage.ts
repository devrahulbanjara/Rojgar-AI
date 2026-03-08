type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image for cropping.'))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Failed to export cropped image.'))
    }, mimeType)
  })
}

function normalizeOutputType(mimeType: string | undefined): {
  mimeType: string
  extension: string
} {
  switch (mimeType) {
    case 'image/png':
      return { mimeType: 'image/png', extension: 'png' }
    case 'image/webp':
      return { mimeType: 'image/webp', extension: 'webp' }
    case 'image/jpeg':
    case 'image/jpg':
      return { mimeType: 'image/jpeg', extension: 'jpeg' }
    default:
      return { mimeType: 'image/png', extension: 'png' }
  }
}

function withExtension(fileName: string, extension: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'avatar'
  return `${baseName}.${extension}`
}

export async function createCroppedImageFile(options: {
  src: string
  crop: PixelCrop
  fileName: string
  mimeType?: string
}): Promise<File> {
  const image = await loadImage(options.src)
  const output = normalizeOutputType(options.mimeType)
  const width = Math.max(1, Math.round(options.crop.width))
  const height = Math.max(1, Math.round(options.crop.height))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not available in this browser.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    options.crop.x,
    options.crop.y,
    options.crop.width,
    options.crop.height,
    0,
    0,
    width,
    height,
  )

  const blob = await canvasToBlob(canvas, output.mimeType)
  return new File([blob], withExtension(options.fileName, output.extension), {
    type: output.mimeType,
  })
}
