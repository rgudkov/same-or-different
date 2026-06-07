// Registers jest-dom matchers (toBeInTheDocument, etc.) and cleans up the
// rendered DOM after each test. Loaded via vitest `setupFiles`.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
