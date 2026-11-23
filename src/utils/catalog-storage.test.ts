import { describe, expect, it } from "vitest";
import { parseCatalogStorageUrl } from "./catalog-storage";
const origin = "https://media.example.test";
describe("private catalog media boundary", () => {
  it("accepts only catalog image buckets on the application's origin", () => {
    expect(parseCatalogStorageUrl(`${origin}/storage/v1/object/public/banners/events/photo.webp`, origin)).toEqual({ bucket: "banners", path: "events/photo.webp" });
    expect(parseCatalogStorageUrl(`${origin}/storage/v1/object/public/payment-proofs/receipt.png`, origin)).toBeNull();
    expect(parseCatalogStorageUrl("https://other.example.test/storage/v1/object/public/banners/photo.webp", origin)).toBeNull();
  });
  it("rejects encoded traversal and signed URLs", () => {
    expect(parseCatalogStorageUrl(`${origin}/storage/v1/object/public/banners/folder%2F..%2Fsecret.webp`, origin)).toBeNull();
    expect(parseCatalogStorageUrl(`${origin}/storage/v1/object/public/banners/photo.webp?token=secret`, origin)).toBeNull();
  });
});