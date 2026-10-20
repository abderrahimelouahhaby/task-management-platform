import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./ui-store";

describe("ui store", () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarCollapsed: false });
  });

  it("starts with the sidebar open", () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("toggles the sidebar", () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });
});
