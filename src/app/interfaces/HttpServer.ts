export interface HttpServer {
  on(method: string, url: string, middlewares: [...Function[]], callback: Function): void
  listen(port: number): void
}