import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAllocationSummary,
  getRequest,
  listAllocationSummaries,
  listExperts,
  listRequests,
} from "@/lib/admin-api";

describe("admin-api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listExperts returns experts array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          error: false,
          message: null,
          data: {
            experts: [{ _id: "1", name: "Expert One", email: "a@b.com" }],
          },
        }),
      }),
    );

    const experts = await listExperts("key");
    expect(experts).toHaveLength(1);
    expect(experts[0].name).toBe("Expert One");
  });

  it("listAllocationSummaries passes pagination and filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          error: false,
          message: null,
          data: {
            items: [
              {
                attemptId: "a1",
                requestId: "req1",
                displayId: "EV-100",
                stage: "initial",
                round: 1,
                attemptedAt: "2026-07-13T12:00:00.000Z",
                expertCount: 3,
                offeredExpertId: "expert-1",
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        }),
      }),
    );

    const result = await listAllocationSummaries("key", {
      page: 1,
      stage: "initial",
      displayId: "EV-",
    });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("stage=initial"),
      expect.any(Object),
    );
  });

  it("getAllocationSummary passes stage query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          error: false,
          message: null,
          data: {
            requestId: "req1",
            stage: "initial",
            attempts: [],
          },
        }),
      }),
    );

    const summary = await getAllocationSummary("key", "req1", "initial");
    expect(summary).toMatchObject({ stage: "initial" });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("stage=initial"),
      expect.any(Object),
    );
  });

  it("listRequests passes status and assignedExpertId filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          error: false,
          message: null,
          data: {
            requests: [{ _id: "req1", status: "accepted", displayId: "EV-1" }],
          },
        }),
      }),
    );

    const requests = await listRequests("key", {
      status: "accepted",
      assignedExpertId: "expert-1",
    });
    expect(requests).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/requests?"),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("status=accepted"),
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("assignedExpertId=expert-1"),
      expect.any(Object),
    );
  });

  it("getRequest fetches request detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          error: false,
          message: null,
          data: { request: { _id: "req1", status: "offered" } },
        }),
      }),
    );

    const request = await getRequest("key", "req1");
    expect(request._id).toBe("req1");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/requests/req1"),
      expect.any(Object),
    );
  });
});
