import { Client } from "pg";
import { createId } from "@paralleldrive/cuid2";

export async function getPostgresConnection() {
  const client = new Client({
    user: "postgate",
    password: "postgate",
    host: "localhost",
    database: "postgate",
    port: 5432
  });

  await client.connect();

  return {
    client,
    chats: {
      async insert(chat: any) {
        const { whatsappId, whatsappName, isGroup, whatsappSessionId } = chat;
        const query = "INSERT INTO 'public'.'Chats' (id, whatsappId, whatsappName, isGroup, whatsappSessionId) values ($1, $2, $3, $4, $5)"
        const values = [createId(), whatsappId, whatsappName, isGroup, whatsappSessionId]
        await client.query(query, values);
      }
    }
  }
}