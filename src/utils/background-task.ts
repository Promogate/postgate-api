// @ts-nocheck

import { getPostgresConnection } from "../lib/pg";

process.on("message", async (items: any) => {
  const db = await getPostgresConnection();
  for (const item of items) {
    db.chats.insert(item)
      .then(() => {
        process.send("item-done")
      })
      .catch((error) => {
        console.error(error)
      });
  }
})