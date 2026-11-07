import { describe, expect, it } from "vitest";
import { readTextBodyWithLimit } from "../src/lib/request-body";

describe("limite de body", () => {
  it("nao confia em Content-Length nao canonico abaixo do cap", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(2049)));
        controller.close();
      },
    });
    const request = new Request("http://localhost/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "1e3" },
      body,
    });

    expect(request.headers.get("Content-Length")).toBe("1e3");
    await expect(readTextBodyWithLimit(request, 2048)).resolves.toEqual({ ok: false });
  });
});
