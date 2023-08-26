import { useEffect, useRef } from 'react'

export default function CanvasCaptcha(props: {
  code: string
  width: number
  height: number
}) {
  const { width, height } = props,
    code = props.code.replace(/\s/g, '')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fontSize = Math.min(height / 2, width / code.length),
    widthPerChar = width / code.length,
    xOffsetRatio = 0.1,
    yOffsetRatio = 0.2,
    sizeOffsetRatio = 0.1,
    noiseRatio = 0.5

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, width, height)
    ctx.textBaseline = 'top'

    for (const [i, char] of code.split('').entries()) {
      const xOffset =
          widthPerChar * xOffsetRatio * Math.random() + widthPerChar * i,
        yOffset = height * yOffsetRatio * Math.random(),
        sizeOffset = fontSize * sizeOffsetRatio * Math.random()

      ctx.font = `${fontSize + sizeOffset}px monospace`
      ctx.fillStyle = '#333'
      ctx.fillText(char, xOffset, yOffset)
    }

    // noise
    const imageData = ctx.getImageData(0, 0, width, height)
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] += Math.random() * 0xff * noiseRatio
      imageData.data[i + 1] += Math.random() * 0xff * noiseRatio
      imageData.data[i + 2] += Math.random() * 0xff * noiseRatio
    }
    ctx.putImageData(imageData, 0, 0)

    //draw lines
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = '#ddd'
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }

    // draw waves
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = '#ada'
      ctx.beginPath()
      ctx.moveTo(0, Math.random() * height)
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        width,
        Math.random() * height
      )
      ctx.stroke()
    }
  })

  return (
    <>
      <canvas
        ref={canvasRef}
        id="canvas"
        width={width}
        height={height}
      ></canvas>
    </>
  )
}
