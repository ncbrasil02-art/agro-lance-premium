import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHomeRealtime } from "./useRealtimeEvent";
const mocks = vi.hoisted(() => ({ channel: vi.fn(), removeChannel: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: mocks }));
vi.mock("@/utils/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
describe("catalog synchronization", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn((callback: (status: string) => void) => { callback("SUBSCRIBED"); return channel; }) };
    mocks.channel.mockReturnValue(channel);
    mocks.channel.mockClear();
    mocks.removeChannel.mockClear();
  });
  afterEach(() => { vi.useRealTimers(); });
  it("retains the channel after a re-render and uses the latest callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(({ callback }) => useHomeRealtime(callback), { initialProps: { callback: first } });
    rerender({ callback: second });
    expect(mocks.channel).toHaveBeenCalledTimes(1);
    act(() => { window.dispatchEvent(new Event("catalog:bid-saved")); });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    unmount();
    expect(mocks.removeChannel).toHaveBeenCalledTimes(1);
  });
  it("refreshes visible lot prices even if a joined socket delivers no changes", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useHomeRealtime(callback));
    act(() => { vi.advanceTimersByTime(10000); });
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
    act(() => { vi.advanceTimersByTime(10000); });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});