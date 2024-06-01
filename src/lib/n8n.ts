import axios from "axios";

const n8n = axios.create({
  baseURL: process.env.N8N_URL
});

export default n8n;