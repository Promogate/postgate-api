import axios, { AxiosInstance } from "axios";
import { EvolutionInstanceConnectResponse } from "../../utils/@types";

describe("", () => {
  const instanceId = "cm0o7mol20001m12f3e9hgfz3";
  const client = axios.create({
    baseURL: "http://localhost:8090",
    headers: {
      Authorization: `Bearer test_token`
    }
  })

  test("Garante que uma instância única seja feita fetch pelo endpoint", async () => {
    const { data } = await client.get<EvolutionInstanceConnectResponse>(`/whatsapp/qrcode/${instanceId}`);
    expect(data.code).toBeDefined();
    expect(data.count).toBeDefined();
    expect(data.pairingCode).toBeDefined();
  })
});