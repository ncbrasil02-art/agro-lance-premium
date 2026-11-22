import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Countdown } from "./countdown";

afterEach(cleanup);
describe("countdown expiration", () => {
  it("notifies once when an expired lot is rerendered with a new callback", () => {
    const notify = vi.fn();
    const endsAt = "2020-01-01T00:00:00Z";
    const { rerender } = render(<Countdown endsAt={endsAt} onEnd={() => notify()} />);
    rerender(<Countdown endsAt={endsAt} onEnd={() => notify()} />);
    expect(notify).toHaveBeenCalledTimes(1);
    rerender(<Countdown endsAt="2020-01-02T00:00:00Z" onEnd={() => notify()} />);
    expect(notify).toHaveBeenCalledTimes(2);
  });
  it("never notifies for an invalid deadline", () => {
    const notify = vi.fn();
    render(<Countdown endsAt="invalid" onEnd={notify} />);
    expect(notify).not.toHaveBeenCalled();
  });
});