import { ExtmodErrorCodes } from "@/util/error";
import { join } from "node:path";
import type { TupleTail } from "./util";

export class ExtmodUrl extends URL {
  static ERROR_PARAM = "__extmod_error";
  static ETAG_PARAM = "__extmod_etag";
  static TTL_PARAM = "__extmod_ttl";
  static CLIENT_PARAM = "__extmod_client";
  static BUNDLE_PARAM = "__extmod_bundle";

  static withProtocol = (
    protocol: string,
    path: string,
    ...rest: TupleTail<ConstructorParameters<typeof URL>>
  ) => new ExtmodUrl(join(protocol, path), ...rest);

  constructor(...url: ConstructorParameters<typeof URL>) {
    super(...url);
  }

  public isRemote(): boolean {
    return /^https?/.test(this.protocol);
  }

  setError(code: keyof typeof ExtmodErrorCodes): this {
    this.searchParams.set(ExtmodUrl.ERROR_PARAM, code.toString());
    return this;
  }
  hasError(): boolean {
    return this.searchParams.has(ExtmodUrl.ERROR_PARAM);
  }
  getError(): keyof typeof ExtmodErrorCodes {
    return this.searchParams.get(
      ExtmodUrl.ERROR_PARAM
    ) as keyof typeof ExtmodErrorCodes;
  }

  setEtag(etag: string): this {
    this.searchParams.set(ExtmodUrl.ETAG_PARAM, etag);
    return this;
  }
  hasEtag(): boolean {
    return this.searchParams.has(ExtmodUrl.ETAG_PARAM);
  }
  getEtag(): string {
    return this.searchParams.get(ExtmodUrl.ETAG_PARAM) as string;
  }

  setTtl(ttl: string): this {
    this.searchParams.set(ExtmodUrl.TTL_PARAM, ttl);
    return this;
  }
  hasTtl(): boolean {
    return this.searchParams.has(ExtmodUrl.TTL_PARAM);
  }
  getTtl(): string {
    return this.searchParams.get(ExtmodUrl.TTL_PARAM) as string;
  }

  setClient(isClient: boolean): this {
    this.searchParams.set(ExtmodUrl.CLIENT_PARAM, `${isClient}`);
    return this;
  }
  hasClient(): boolean {
    return this.searchParams.has(ExtmodUrl.CLIENT_PARAM);
  }
  getClient(): boolean {
    return this.searchParams.get(ExtmodUrl.CLIENT_PARAM) === "true"
      ? true
      : false;
  }

  setBundle(isBundle: boolean): this {
    this.searchParams.set(ExtmodUrl.BUNDLE_PARAM, `${isBundle}`);
    return this;
  }
  hasBundle(): boolean {
    return this.searchParams.has(ExtmodUrl.BUNDLE_PARAM);
  }
  getBundle(): boolean {
    return this.searchParams.get(ExtmodUrl.BUNDLE_PARAM) === "true"
      ? true
      : false;
  }

  toOG(): URL {
    const url = new URL(this);
    [
      ExtmodUrl.ERROR_PARAM,
      ExtmodUrl.ETAG_PARAM,
      ExtmodUrl.TTL_PARAM,
      ExtmodUrl.CLIENT_PARAM,
    ].forEach((param) => url.searchParams.delete(param));

    return url;
  }
}
