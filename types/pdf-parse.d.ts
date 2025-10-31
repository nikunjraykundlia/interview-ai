declare module 'pdf-parse' {
  interface PDFParseData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }
  function pdfParse(data: Buffer | Uint8Array, options?: any): Promise<PDFParseData>;
  export default pdfParse;
}
