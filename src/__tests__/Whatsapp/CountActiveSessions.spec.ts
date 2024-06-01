import api from "../../lib/n8n";

describe("Whatsapp Sessions Suite", () => {
  it("should return the count of all active whatsapp sessions", async () => {
    const { data, status } = await api.get("/whatsapp/session/active-sessions");
    expect(status).toBe(200);
    expect(data).toEqual({ activeSessions: 0 });
  });
});