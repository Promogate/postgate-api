export const buildN8nUrl = (path: string) => {
  return process.env.N8N_ENV === "development" ? 
  process.env.N8N_URL + "/webhook-test" + path :
  process.env.N8N_URL + "/webhook" + path
}