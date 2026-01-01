declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: {
      type?: string
      quality?: number
    }
    html2canvas?: {
      scale?: number
      useCORS?: boolean
      logging?: boolean
      letterRendering?: boolean
    }
    jsPDF?: {
      unit?: string
      format?: string | number[]
      orientation?: 'portrait' | 'landscape'
    }
    pagebreak?: {
      mode?: string | string[]
      before?: string | string[]
      after?: string | string[]
      avoid?: string | string[]
    }
  }
  
  function html2pdf(
    element?: HTMLElement | string,
    options?: Html2PdfOptions
  ): {
    from: (element: HTMLElement | string) => any
    set: (options: Html2PdfOptions) => any
    save: () => Promise<void>
    outputPdf: (type?: string) => Promise<any>
    then: (callback: () => void) => any
  }
  
  export default html2pdf
}
