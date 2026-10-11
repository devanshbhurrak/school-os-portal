import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { OfflineBanner } from "@/components/patterns/offline-banner";

describe("Portal Smoke Tests", () => {
  it("renders OfflineBanner component without crashing", () => {
    const { container } = render(<OfflineBanner />);
    expect(container).toBeDefined();
  });
});
