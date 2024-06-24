import axios from "axios";

const instance = "clxaeczhj0001eq699l4fc1t9";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnN0YW5jZU5hbWUiOiJjbHhhZWN6aGowMDAxZXE2OTlsNGZjMXQ5IiwiYXBpTmFtZSI6IndoYXRzYXBwLWFwaSIsInRva2VuSWQiOiIxYzZkZTZmOS05ZWVlLTQ0YjUtYTNlNC1kOTNiM2RlYzljYmEiLCJpYXQiOjE3MTgxMTAwNDUsImV4cCI6MTcxODExMDA0NSwic3ViIjoiZy10In0.s18idOOcZ1acq6njCbS9DdhDeeFkrXszhknrX2492Jc";
const auth = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNseDNkMXczbjAwMDE1dHVuZGkxdzk1bHUiLCJlbWFpbCI6Imd1dG9kaWFzZGV2QGdtYWlsLmNvbSIsImlhdCI6MTcxODYyNjUwOCwiZXhwIjoxNzE4NzEyOTA4fQ.hSdSQ6OB4UWmBBssG0oZgAU1PHmwZamFZO5CMV9H96o";

describe("", () => {
  it("", async () => {
    const { data, status } = await axios.post("http://localhost:8090/codechat/getChats/" + instance, {
      token: token
    }, {
      headers: {
        Authorization: "Bearer " + auth
      }
    });
    console.log(data.length);
    expect(status).toBe(200);
    expect(data).toEqual({});
  });
})