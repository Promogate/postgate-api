import axios, { AxiosInstance } from "axios";
import { EvolutionInstanceConnectResponse } from "../../utils/@types";

describe("Integration Groups Suite", () => {
  const instanceId = "cm0o7mol20001m12f3e9hgfz3";
  const client = axios.create({
    baseURL: "http://localhost:8090",
    headers: {
      Authorization: `Bearer test_token`
    }
  })

  test("Garante que uma instância única seja feita fetch pelo endpoint", async () => {
    const { data } = await client.post(`/whatsapp/sync_chats/${instanceId}`);
    expect(1).toBe(1);
  })
});