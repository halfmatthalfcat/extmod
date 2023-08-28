import { ExtmodErrorCodes } from "@/util/error";

export class ExtmodUrl extends URL {
  static ERROR_PARAM = "__extmod_error";
  static ETAG_PARAM = "__extmod_etag";
  static TTL_PARAM = "__extmod_ttl";

  constructor(...url: ConstructorParameters<typeof URL>) {
    super(...url);
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

  toOG(): URL {
    const url = new URL(this);
    [ExtmodUrl.ERROR_PARAM, ExtmodUrl.ETAG_PARAM, ExtmodUrl.TTL_PARAM].forEach(
      (param) => url.searchParams.delete(param)
    );

    return url;
  }
}
