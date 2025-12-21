/**
 * Görsel Soru Üretici - SVG Geometri ve Chart Üretimi
 * 
 * Bu modül matematik ve fen bilimleri için görsel sorular üretir:
 * 1. SVG Geometri: Üçgen, kare, daire, koordinat düzlemi
 * 2. Chart.js: Fonksiyon grafikleri, bar/line chartlar
 */

// =====================================================
// SVG GEOMETRİ ÜRETİCİ
// =====================================================

export interface GeometryShape {
  type: 'triangle' | 'rectangle' | 'square' | 'circle' | 'parallelogram' | 'trapezoid' | 'rhombus' | 'pentagon' | 'hexagon'
  dimensions: Record<string, number>
  labels?: Record<string, string>
  showAngles?: boolean
  showDimensions?: boolean
  color?: string
}

export interface CoordinatePlane {
  type: 'coordinate'
  points?: { x: number; y: number; label?: string }[]
  lines?: { start: { x: number; y: number }; end: { x: number; y: number }; color?: string }[]
  xRange: [number, number]
  yRange: [number, number]
  gridStep?: number
}

export interface GeometryConfig {
  width?: number
  height?: number
  padding?: number
  showGrid?: boolean
  backgroundColor?: string
  strokeColor?: string
  fillColor?: string
  fontSize?: number
}

const DEFAULT_CONFIG: GeometryConfig = {
  width: 400,
  height: 400,
  padding: 40,
  showGrid: false,
  backgroundColor: '#ffffff',
  strokeColor: '#1e293b',
  fillColor: '#f1f5f9',
  fontSize: 14
}

// Üçgen SVG üretici
export function generateTriangleSVG(
  a: number, 
  b: number, 
  c: number,
  labels?: { A?: string; B?: string; C?: string; a?: string; b?: string; c?: string },
  config: GeometryConfig = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const { width, height, padding, strokeColor, fillColor, fontSize } = cfg
  
  // Üçgen köşe koordinatlarını hesapla (kosinüs teoremi ile)
  const cosA = (b * b + c * c - a * a) / (2 * b * c)
  const angleA = Math.acos(Math.max(-1, Math.min(1, cosA)))
  
  // Noktalar
  const scale = Math.min((width! - 2 * padding!) / c, (height! - 2 * padding!) / (b * Math.sin(angleA))) * 0.8
  const x1 = padding!
  const y1 = height! - padding!
  const x2 = padding! + c * scale
  const y2 = height! - padding!
  const x3 = padding! + b * scale * Math.cos(angleA)
  const y3 = height! - padding! - b * scale * Math.sin(angleA)
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${cfg.backgroundColor}"/>
      
      <!-- Üçgen -->
      <polygon 
        points="${x1},${y1} ${x2},${y2} ${x3},${y3}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="2"
      />
      
      <!-- Köşe etiketleri -->
      <text x="${x1 - 15}" y="${y1 + 5}" font-size="${fontSize}" fill="${strokeColor}" font-weight="bold">${labels?.A || 'A'}</text>
      <text x="${x2 + 10}" y="${y2 + 5}" font-size="${fontSize}" fill="${strokeColor}" font-weight="bold">${labels?.B || 'B'}</text>
      <text x="${x3}" y="${y3 - 10}" font-size="${fontSize}" fill="${strokeColor}" font-weight="bold">${labels?.C || 'C'}</text>
      
      <!-- Kenar uzunlukları -->
      <text x="${(x1 + x2) / 2}" y="${y1 + 20}" font-size="${fontSize! - 2}" fill="#3b82f6" text-anchor="middle">${labels?.c || c}</text>
      <text x="${(x2 + x3) / 2 + 15}" y="${(y2 + y3) / 2}" font-size="${fontSize! - 2}" fill="#3b82f6">${labels?.a || a}</text>
      <text x="${(x1 + x3) / 2 - 20}" y="${(y1 + y3) / 2}" font-size="${fontSize! - 2}" fill="#3b82f6">${labels?.b || b}</text>
    </svg>
  `.trim()
}

// Dikdörtgen/Kare SVG üretici
export function generateRectangleSVG(
  width: number,
  height: number,
  labels?: { width?: string; height?: string },
  config: GeometryConfig = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const svgWidth = cfg.width!
  const svgHeight = cfg.height!
  const padding = cfg.padding!
  
  const scale = Math.min((svgWidth - 2 * padding) / width, (svgHeight - 2 * padding) / height) * 0.7
  const rectWidth = width * scale
  const rectHeight = height * scale
  const x = (svgWidth - rectWidth) / 2
  const y = (svgHeight - rectHeight) / 2
  
  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${cfg.backgroundColor}"/>
      
      <!-- Dikdörtgen -->
      <rect 
        x="${x}" y="${y}" 
        width="${rectWidth}" height="${rectHeight}"
        fill="${cfg.fillColor}" 
        stroke="${cfg.strokeColor}" 
        stroke-width="2"
      />
      
      <!-- Köşe noktaları -->
      <circle cx="${x}" cy="${y}" r="4" fill="${cfg.strokeColor}"/>
      <circle cx="${x + rectWidth}" cy="${y}" r="4" fill="${cfg.strokeColor}"/>
      <circle cx="${x + rectWidth}" cy="${y + rectHeight}" r="4" fill="${cfg.strokeColor}"/>
      <circle cx="${x}" cy="${y + rectHeight}" r="4" fill="${cfg.strokeColor}"/>
      
      <!-- Boyut etiketleri -->
      <text x="${x + rectWidth / 2}" y="${y + rectHeight + 25}" font-size="${cfg.fontSize}" fill="#3b82f6" text-anchor="middle">${labels?.width || width} cm</text>
      <text x="${x - 25}" y="${y + rectHeight / 2}" font-size="${cfg.fontSize}" fill="#3b82f6" text-anchor="middle" transform="rotate(-90, ${x - 25}, ${y + rectHeight / 2})">${labels?.height || height} cm</text>
      
      <!-- Dik açı işaretleri -->
      <path d="M ${x + 15} ${y} L ${x + 15} ${y + 15} L ${x} ${y + 15}" fill="none" stroke="${cfg.strokeColor}" stroke-width="1"/>
    </svg>
  `.trim()
}

// Daire SVG üretici
export function generateCircleSVG(
  radius: number,
  showRadius?: boolean,
  showDiameter?: boolean,
  labels?: { radius?: string; diameter?: string; center?: string },
  config: GeometryConfig = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const svgWidth = cfg.width!
  const svgHeight = cfg.height!
  
  const scale = Math.min(svgWidth, svgHeight) / (radius * 3)
  const r = radius * scale
  const cx = svgWidth / 2
  const cy = svgHeight / 2
  
  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${cfg.backgroundColor}"/>
      
      <!-- Daire -->
      <circle 
        cx="${cx}" cy="${cy}" r="${r}"
        fill="${cfg.fillColor}" 
        stroke="${cfg.strokeColor}" 
        stroke-width="2"
      />
      
      <!-- Merkez noktası -->
      <circle cx="${cx}" cy="${cy}" r="4" fill="${cfg.strokeColor}"/>
      <text x="${cx + 10}" y="${cy - 10}" font-size="${cfg.fontSize}" fill="${cfg.strokeColor}">${labels?.center || 'O'}</text>
      
      ${showRadius ? `
        <!-- Yarıçap -->
        <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3"/>
        <text x="${cx + r / 2}" y="${cy - 10}" font-size="${cfg.fontSize! - 2}" fill="#ef4444" text-anchor="middle">r = ${labels?.radius || radius}</text>
      ` : ''}
      
      ${showDiameter ? `
        <!-- Çap -->
        <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#3b82f6" stroke-width="2"/>
        <text x="${cx}" y="${cy + r + 25}" font-size="${cfg.fontSize! - 2}" fill="#3b82f6" text-anchor="middle">d = ${labels?.diameter || radius * 2}</text>
      ` : ''}
    </svg>
  `.trim()
}

// Koordinat düzlemi SVG üretici
export function generateCoordinatePlaneSVG(
  config: CoordinatePlane & GeometryConfig
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const { width, height, padding, strokeColor, fontSize } = cfg
  const { xRange, yRange, points, lines, gridStep = 1 } = config
  
  const innerWidth = width! - 2 * padding!
  const innerHeight = height! - 2 * padding!
  
  const xScale = innerWidth / (xRange[1] - xRange[0])
  const yScale = innerHeight / (yRange[1] - yRange[0])
  
  const originX = padding! + (-xRange[0]) * xScale
  const originY = padding! + yRange[1] * yScale
  
  // Grid çizgileri
  let gridLines = ''
  for (let x = xRange[0]; x <= xRange[1]; x += gridStep) {
    const px = padding! + (x - xRange[0]) * xScale
    gridLines += `<line x1="${px}" y1="${padding}" x2="${px}" y2="${height! - padding!}" stroke="#e2e8f0" stroke-width="1"/>`
    if (x !== 0) {
      gridLines += `<text x="${px}" y="${originY + 15}" font-size="10" fill="#64748b" text-anchor="middle">${x}</text>`
    }
  }
  for (let y = yRange[0]; y <= yRange[1]; y += gridStep) {
    const py = padding! + (yRange[1] - y) * yScale
    gridLines += `<line x1="${padding}" y1="${py}" x2="${width! - padding!}" y2="${py}" stroke="#e2e8f0" stroke-width="1"/>`
    if (y !== 0) {
      gridLines += `<text x="${originX - 10}" y="${py + 4}" font-size="10" fill="#64748b" text-anchor="end">${y}</text>`
    }
  }
  
  // Noktalar
  let pointsSVG = ''
  if (points) {
    points.forEach((p, i) => {
      const px = originX + p.x * xScale
      const py = originY - p.y * yScale
      pointsSVG += `
        <circle cx="${px}" cy="${py}" r="5" fill="#ef4444"/>
        <text x="${px + 10}" y="${py - 10}" font-size="${fontSize! - 2}" fill="#ef4444">${p.label || `(${p.x}, ${p.y})`}</text>
      `
    })
  }
  
  // Çizgiler
  let linesSVG = ''
  if (lines) {
    lines.forEach((l) => {
      const x1 = originX + l.start.x * xScale
      const y1 = originY - l.start.y * yScale
      const x2 = originX + l.end.x * xScale
      const y2 = originY - l.end.y * yScale
      linesSVG += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${l.color || '#3b82f6'}" stroke-width="2"/>`
    })
  }
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${cfg.backgroundColor}"/>
      
      <!-- Grid -->
      ${gridLines}
      
      <!-- Eksenler -->
      <line x1="${padding}" y1="${originY}" x2="${width! - padding!}" y2="${originY}" stroke="${strokeColor}" stroke-width="2"/>
      <line x1="${originX}" y1="${padding}" x2="${originX}" y2="${height! - padding!}" stroke="${strokeColor}" stroke-width="2"/>
      
      <!-- Ok uçları -->
      <polygon points="${width! - padding! - 10},${originY - 5} ${width! - padding!},${originY} ${width! - padding! - 10},${originY + 5}" fill="${strokeColor}"/>
      <polygon points="${originX - 5},${padding! + 10} ${originX},${padding} ${originX + 5},${padding! + 10}" fill="${strokeColor}"/>
      
      <!-- Eksen etiketleri -->
      <text x="${width! - padding! + 5}" y="${originY + 5}" font-size="${fontSize}" fill="${strokeColor}">x</text>
      <text x="${originX + 5}" y="${padding! - 5}" font-size="${fontSize}" fill="${strokeColor}">y</text>
      <text x="${originX - 10}" y="${originY + 15}" font-size="10" fill="#64748b">0</text>
      
      <!-- Çizgiler -->
      ${linesSVG}
      
      <!-- Noktalar -->
      ${pointsSVG}
    </svg>
  `.trim()
}

// Paralel kenar SVG üretici  
export function generateParallelogramSVG(
  base: number,
  height: number,
  slant: number,
  labels?: { base?: string; height?: string },
  config: GeometryConfig = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const svgWidth = cfg.width!
  const svgHeight = cfg.height!
  const padding = cfg.padding!
  
  const scale = Math.min((svgWidth - 2 * padding) / (base + slant), (svgHeight - 2 * padding) / height) * 0.7
  const b = base * scale
  const h = height * scale
  const s = slant * scale
  
  const x1 = (svgWidth - b - s) / 2 + s
  const y1 = (svgHeight + h) / 2
  const x2 = x1 + b
  const y2 = y1
  const x3 = x2 - s
  const y3 = y1 - h
  const x4 = x1 - s
  const y4 = y3
  
  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${cfg.backgroundColor}"/>
      
      <!-- Paralel kenar -->
      <polygon 
        points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" 
        fill="${cfg.fillColor}" 
        stroke="${cfg.strokeColor}" 
        stroke-width="2"
      />
      
      <!-- Yükseklik çizgisi -->
      <line x1="${x4 + s}" y1="${y4}" x2="${x4 + s}" y2="${y1}" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3"/>
      
      <!-- Boyut etiketleri -->
      <text x="${(x1 + x2) / 2}" y="${y1 + 25}" font-size="${cfg.fontSize}" fill="#3b82f6" text-anchor="middle">${labels?.base || base} cm</text>
      <text x="${x4 + s + 15}" y="${(y1 + y4) / 2}" font-size="${cfg.fontSize}" fill="#ef4444">h = ${labels?.height || height} cm</text>
    </svg>
  `.trim()
}

// =====================================================
// CHART/GRAFİK ÜRETİCİ (Chart.js config)
// =====================================================

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'function'
  title?: string
  xLabel?: string
  yLabel?: string
  data: {
    labels?: string[]
    datasets: {
      label?: string
      data: number[] | { x: number; y: number }[]
      color?: string
    }[]
  }
  options?: {
    xMin?: number
    xMax?: number
    yMin?: number
    yMax?: number
    showGrid?: boolean
  }
}

export interface FunctionGraphConfig {
  functions: {
    expression: string  // "x^2", "sin(x)", "2x+1" gibi
    color?: string
    label?: string
  }[]
  xRange: [number, number]
  yRange: [number, number]
  title?: string
}

// Fonksiyon grafiği için veri noktaları üret
export function generateFunctionPoints(
  expression: string,
  xMin: number,
  xMax: number,
  steps: number = 100
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const step = (xMax - xMin) / steps
  
  for (let x = xMin; x <= xMax; x += step) {
    try {
      // Basit matematiksel ifadeleri değerlendir
      let y: number
      const expr = expression
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log')
        .replace(/ln/g, 'Math.log')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-z])/g, 'Math.E')
      
      // eslint-disable-next-line no-eval
      y = eval(expr.replace(/x/g, `(${x})`))
      
      if (isFinite(y)) {
        points.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 })
      }
    } catch {
      // Geçersiz değerler için atla
    }
  }
  
  return points
}

// Chart.js config objesi üret
export function generateChartConfig(config: ChartConfig): object {
  const { type, title, xLabel, yLabel, data, options } = config
  
  return {
    type: type === 'function' ? 'line' : type,
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label || `Veri ${i + 1}`,
        data: ds.data,
        borderColor: ds.color || ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'][i % 4],
        backgroundColor: ds.color ? `${ds.color}33` : ['#3b82f633', '#ef444433', '#22c55e33', '#f59e0b33'][i % 4],
        borderWidth: 2,
        fill: type === 'line' ? false : true,
        tension: 0.1,
        pointRadius: type === 'scatter' ? 5 : 3,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: { size: 16 }
        },
        legend: {
          display: data.datasets.length > 1
        }
      },
      scales: {
        x: {
          title: {
            display: !!xLabel,
            text: xLabel
          },
          min: options?.xMin,
          max: options?.xMax,
          grid: {
            display: options?.showGrid !== false
          }
        },
        y: {
          title: {
            display: !!yLabel,
            text: yLabel
          },
          min: options?.yMin,
          max: options?.yMax,
          grid: {
            display: options?.showGrid !== false
          }
        }
      }
    }
  }
}

// =====================================================
// HAZIR SORU ŞABLONLARI
// =====================================================

export interface VisualQuestion {
  question_text: string
  visual_type: 'svg' | 'chart'
  visual_data: string // SVG string veya Chart.js config JSON
  options: {
    A: string
    B: string
    C: string
    D: string
    E?: string
  }
  correct_answer: string
  explanation: string
  difficulty: string
  topic: string
}

// Geometri soru şablonları
export const GEOMETRY_TEMPLATES = {
  triangleArea: {
    name: 'Üçgen Alan Hesabı',
    generate: (base: number, height: number): VisualQuestion => {
      const area = (base * height) / 2
      return {
        question_text: `Aşağıdaki üçgenin alanını hesaplayınız.`,
        visual_type: 'svg',
        visual_data: generateTriangleSVG(base, height, Math.sqrt(base * base + height * height), {
          a: `${height} cm`,
          c: `${base} cm`
        }),
        options: {
          A: `${area} cm²`,
          B: `${area + 5} cm²`,
          C: `${area - 3} cm²`,
          D: `${base * height} cm²`
        },
        correct_answer: 'A',
        explanation: `Üçgenin alanı = (taban × yükseklik) / 2 = (${base} × ${height}) / 2 = ${area} cm²`,
        difficulty: 'orta',
        topic: 'Üçgenler'
      }
    }
  },
  
  rectanglePerimeter: {
    name: 'Dikdörtgen Çevre Hesabı',
    generate: (width: number, height: number): VisualQuestion => {
      const perimeter = 2 * (width + height)
      return {
        question_text: `Aşağıdaki dikdörtgenin çevresini hesaplayınız.`,
        visual_type: 'svg',
        visual_data: generateRectangleSVG(width, height),
        options: {
          A: `${perimeter} cm`,
          B: `${width * height} cm`,
          C: `${perimeter + 4} cm`,
          D: `${perimeter - 2} cm`
        },
        correct_answer: 'A',
        explanation: `Dikdörtgenin çevresi = 2 × (en + boy) = 2 × (${width} + ${height}) = ${perimeter} cm`,
        difficulty: 'kolay',
        topic: 'Dörtgenler'
      }
    }
  },
  
  circleArea: {
    name: 'Daire Alan Hesabı',
    generate: (radius: number): VisualQuestion => {
      const area = Math.round(Math.PI * radius * radius * 100) / 100
      return {
        question_text: `Yarıçapı ${radius} cm olan dairenin alanını hesaplayınız. (π = 3.14)`,
        visual_type: 'svg',
        visual_data: generateCircleSVG(radius, true, false, { radius: `${radius} cm` }),
        options: {
          A: `${area} cm²`,
          B: `${Math.round(2 * Math.PI * radius * 100) / 100} cm²`,
          C: `${Math.round(area * 1.5 * 100) / 100} cm²`,
          D: `${radius * radius} cm²`
        },
        correct_answer: 'A',
        explanation: `Dairenin alanı = π × r² = 3.14 × ${radius}² = ${area} cm²`,
        difficulty: 'orta',
        topic: 'Daire'
      }
    }
  },
  
  coordinateDistance: {
    name: 'İki Nokta Arası Uzaklık',
    generate: (x1: number, y1: number, x2: number, y2: number): VisualQuestion => {
      const distance = Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 100) / 100
      return {
        question_text: `A(${x1}, ${y1}) ve B(${x2}, ${y2}) noktaları arasındaki uzaklığı bulunuz.`,
        visual_type: 'svg',
        visual_data: generateCoordinatePlaneSVG({
          type: 'coordinate',
          xRange: [Math.min(x1, x2) - 2, Math.max(x1, x2) + 2],
          yRange: [Math.min(y1, y2) - 2, Math.max(y1, y2) + 2],
          points: [
            { x: x1, y: y1, label: `A(${x1},${y1})` },
            { x: x2, y: y2, label: `B(${x2},${y2})` }
          ],
          lines: [
            { start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color: '#3b82f6' }
          ]
        }),
        options: {
          A: `${distance} birim`,
          B: `${Math.abs(x2 - x1) + Math.abs(y2 - y1)} birim`,
          C: `${distance + 1} birim`,
          D: `${Math.round(distance - 0.5)} birim`
        },
        correct_answer: 'A',
        explanation: `İki nokta arası uzaklık = √[(x₂-x₁)² + (y₂-y₁)²] = √[(${x2}-${x1})² + (${y2}-${y1})²] = ${distance} birim`,
        difficulty: 'orta',
        topic: 'Analitik Geometri'
      }
    }
  }
}

// Grafik soru şablonları
export const CHART_TEMPLATES = {
  linearFunction: {
    name: 'Doğrusal Fonksiyon Grafiği',
    generate: (m: number, b: number): VisualQuestion => {
      const points = generateFunctionPoints(`${m}*x + ${b}`, -5, 5, 50)
      const chartConfig = generateChartConfig({
        type: 'function',
        title: 'y = mx + n',
        xLabel: 'x',
        yLabel: 'y',
        data: {
          datasets: [{
            label: `y = ${m}x ${b >= 0 ? '+' : ''}${b}`,
            data: points,
            color: '#3b82f6'
          }]
        },
        options: { xMin: -5, xMax: 5, yMin: -10, yMax: 10 }
      })
      
      return {
        question_text: `Grafikte verilen doğrunun denklemi nedir?`,
        visual_type: 'chart',
        visual_data: JSON.stringify(chartConfig),
        options: {
          A: `y = ${m}x ${b >= 0 ? '+' : ''}${b}`,
          B: `y = ${-m}x ${b >= 0 ? '+' : ''}${b}`,
          C: `y = ${m}x ${-b >= 0 ? '+' : ''}${-b}`,
          D: `y = ${m + 1}x ${b >= 0 ? '+' : ''}${b}`
        },
        correct_answer: 'A',
        explanation: `Doğrunun eğimi ${m}, y-kesişimi ${b} olduğundan denklemi y = ${m}x ${b >= 0 ? '+' : ''}${b}'dir.`,
        difficulty: 'orta',
        topic: 'Doğrusal Fonksiyonlar'
      }
    }
  },
  
  quadraticFunction: {
    name: 'İkinci Dereceden Fonksiyon',
    generate: (a: number): VisualQuestion => {
      const points = generateFunctionPoints(`${a}*x^2`, -4, 4, 80)
      const chartConfig = generateChartConfig({
        type: 'function',
        title: 'y = ax²',
        xLabel: 'x',
        yLabel: 'y',
        data: {
          datasets: [{
            label: `y = ${a}x²`,
            data: points,
            color: '#ef4444'
          }]
        },
        options: { xMin: -4, xMax: 4, yMin: -2, yMax: 16 }
      })
      
      return {
        question_text: `Grafikte verilen parabolün denklemi nedir?`,
        visual_type: 'chart',
        visual_data: JSON.stringify(chartConfig),
        options: {
          A: `y = ${a}x²`,
          B: `y = ${-a}x²`,
          C: `y = ${a * 2}x²`,
          D: `y = x² ${a >= 0 ? '+' : ''}${a}`
        },
        correct_answer: 'A',
        explanation: `Parabol orijinden geçiyor ve ${a > 0 ? 'yukarı' : 'aşağı'} açılıyor. a = ${a} olduğundan denklemi y = ${a}x²'dir.`,
        difficulty: 'zor',
        topic: 'İkinci Dereceden Fonksiyonlar'
      }
    }
  },
  
  barChart: {
    name: 'Sütun Grafik Yorumlama',
    generate: (data: number[], labels: string[]): VisualQuestion => {
      const max = Math.max(...data)
      const maxIndex = data.indexOf(max)
      const total = data.reduce((a, b) => a + b, 0)
      
      const chartConfig = generateChartConfig({
        type: 'bar',
        title: 'Aylık Satış Verileri',
        xLabel: 'Aylar',
        yLabel: 'Satış (adet)',
        data: {
          labels,
          datasets: [{
            label: 'Satış',
            data,
            color: '#22c55e'
          }]
        }
      })
      
      return {
        question_text: `Grafiğe göre en çok satış hangi ayda yapılmıştır?`,
        visual_type: 'chart',
        visual_data: JSON.stringify(chartConfig),
        options: {
          A: labels[maxIndex],
          B: labels[(maxIndex + 1) % labels.length],
          C: labels[(maxIndex + 2) % labels.length],
          D: labels[(maxIndex + 3) % labels.length]
        },
        correct_answer: 'A',
        explanation: `Grafiğe bakıldığında en yüksek sütun ${labels[maxIndex]} ayına aittir. Bu ayda ${max} adet satış yapılmıştır.`,
        difficulty: 'kolay',
        topic: 'Veri Yorumlama'
      }
    }
  }
}

// Rastgele görsel soru üret
export function generateRandomVisualQuestion(
  category: 'geometry' | 'chart',
  difficulty: 'kolay' | 'orta' | 'zor' = 'orta'
): VisualQuestion {
  if (category === 'geometry') {
    const templates = Object.values(GEOMETRY_TEMPLATES)
    const template = templates[Math.floor(Math.random() * templates.length)]
    
    // Rastgele değerler
    const values = difficulty === 'kolay' 
      ? [3, 4, 5, 6].map(v => v + Math.floor(Math.random() * 3))
      : [5, 7, 8, 10, 12].map(v => v + Math.floor(Math.random() * 5))
    
    if (template.name === 'Üçgen Alan Hesabı') {
      return (template as typeof GEOMETRY_TEMPLATES.triangleArea).generate(values[0], values[1])
    } else if (template.name === 'Dikdörtgen Çevre Hesabı') {
      return (template as typeof GEOMETRY_TEMPLATES.rectanglePerimeter).generate(values[0], values[1])
    } else if (template.name === 'Daire Alan Hesabı') {
      return (template as typeof GEOMETRY_TEMPLATES.circleArea).generate(values[0])
    } else {
      return (template as typeof GEOMETRY_TEMPLATES.coordinateDistance).generate(values[0], values[1], values[2], values[3])
    }
  } else {
    const templates = Object.values(CHART_TEMPLATES)
    const template = templates[Math.floor(Math.random() * templates.length)]
    
    if (template.name === 'Doğrusal Fonksiyon Grafiği') {
      const m = Math.floor(Math.random() * 5) - 2
      const b = Math.floor(Math.random() * 7) - 3
      return (template as typeof CHART_TEMPLATES.linearFunction).generate(m || 1, b)
    } else if (template.name === 'İkinci Dereceden Fonksiyon') {
      const a = [1, 2, -1, -2][Math.floor(Math.random() * 4)]
      return (template as typeof CHART_TEMPLATES.quadraticFunction).generate(a)
    } else {
      const data = [10, 15, 20, 25, 30].map(v => v + Math.floor(Math.random() * 20))
      const labels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs']
      return (template as typeof CHART_TEMPLATES.barChart).generate(data, labels)
    }
  }
}

