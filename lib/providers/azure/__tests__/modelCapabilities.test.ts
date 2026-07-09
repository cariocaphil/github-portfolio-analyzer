import { describe, expect, it } from "vitest";
import { resolveAzureModelCapabilities } from "../modelCapabilities";

describe("modelCapabilities", () => {
  it("disables temperature and top_p for gpt-5 deployments", () => {
    expect(resolveAzureModelCapabilities("gpt-5-mini")).toEqual({
      supportsTemperature: false,
      supportsTopP: false,
    });
  });

  it("keeps sampling parameters enabled by default for other deployments", () => {
    expect(resolveAzureModelCapabilities("gpt-4o-mini")).toEqual({
      supportsTemperature: true,
      supportsTopP: true,
    });
  });
});
