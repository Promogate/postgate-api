import api from "../../lib/n8n";

describe("User Suite", () => {
  it.skip("should ensure create route is accessable", async () => {
    const { data, status } = await api.post("/user/create");
    expect(status).toBe(201);
    expect(data).toEqual({ message: "ok" })
  });
})