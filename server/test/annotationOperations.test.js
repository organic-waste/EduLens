/* 单元测试标注 */
const {
  applyOperationToData,
  transformOperation,
} = require("../services/annotationOperations");

describe("applyOperationToData", () => {
  it("upserts annotations without mutating existing arrays", () => {
    const source = { rectangles: [{ id: "r1", label: "old" }] };
    const result = applyOperationToData(source, {
      type: "rectangle-update",
      data: { id: "r1", label: "new" },
    });
    expect(result.rectangles).toEqual([{ id: "r1", label: "new" }]);
    expect(source.rectangles).toEqual([{ id: "r1", label: "old" }]);
  });

  it("deletes only the requested image", () => {
    const result = applyOperationToData(
      {
        images: [{ id: "image-1" }, { id: "image-2" }],
        bookmarks: [{ id: "bookmark-1" }],
      },
      { type: "image-delete", data: { id: "image-1" } },
    );
    expect(result.images).toEqual([{ id: "image-2" }]);
    expect(result.bookmarks).toEqual([{ id: "bookmark-1" }]);
  });

  it("rejects unsupported operations instead of silently persisting them", () => {
    expect(() =>
      applyOperationToData({}, { type: "unknown", data: {} }),
    ).toThrow("Unsupported annotation operation: unknown");
  });
});

describe("transformOperation", () => {
  it("rejects a stale update to the same annotation", () => {
    const result = transformOperation(
      {
        type: "rectangle-update",
        timestamp: "2026-01-01T00:00:00.000Z",
        data: { id: "r1" },
      },
      [
        {
          type: "rectangle-update",
          timestamp: "2026-01-01T00:00:01.000Z",
          data: { id: "r1" },
        },
      ],
      0,
    );
    expect(result).toEqual({ type: "reject" });
  });

  it("keeps concurrent updates to different rectangles", () => {
    const operation = {
      type: "rectangle-update",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: { id: "r2" },
    };
    const result = transformOperation(
      operation,
      [
        {
          type: "rectangle-update",
          timestamp: "2026-01-01T00:01:00.000Z",
          data: { id: "r1" },
        },
      ],
      0,
    );
    expect(result).toEqual(operation);
  });

  it("separates bookmarks that would otherwise overlap", () => {
    const result = transformOperation(
      { type: "bookmark-add", data: { id: "b2", scrollPercent: 0.1 } },
      [{ type: "bookmark-add", data: { id: "b1", scrollPercent: 0.102 } }],
      0,
    );
    expect(result.data.scrollPercent).toBeCloseTo(0.105);
  });

  it("keeps updates to different bookmark IDs even when their types match", () => {
    const operation = {
      type: "bookmark-update",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: { id: "b2", text: "client" },
    };
    expect(
      transformOperation(
        operation,
        [
          {
            type: "bookmark-update",
            timestamp: "2026-01-01T00:01:00.000Z",
            data: { id: "b1", text: "server" },
          },
        ],
        0,
      ),
    ).toEqual(operation);
  });

  it("applies the same ID conflict rule to images", () => {
    const operation = {
      type: "image-update",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: { id: "image-2", x: 10 },
    };
    expect(
      transformOperation(
        operation,
        [
          {
            type: "image-update",
            timestamp: "2026-01-01T00:01:00.000Z",
            data: { id: "image-1", x: 20 },
          },
        ],
        0,
      ),
    ).toEqual(operation);
  });

  it("does not revive an annotation after a newer delete", () => {
    const result = transformOperation(
      {
        type: "image-update",
        timestamp: "2026-01-01T00:00:00.000Z",
        data: { id: "image-1", x: 10 },
      },
      [
        {
          type: "image-delete",
          timestamp: "2026-01-01T00:01:00.000Z",
          data: { id: "image-1" },
        },
      ],
      0,
    );
    expect(result).toEqual({ type: "reject" });
  });

  it("clamps bookmark offsets at the end of the page", () => {
    const result = transformOperation(
      { type: "bookmark-add", data: { id: "b2", scrollPercent: 0.999 } },
      [{ type: "bookmark-add", data: { id: "b1", scrollPercent: 0.997 } }],
      0,
    );
    expect(result.data.scrollPercent).toBe(1);
  });
});
