declare module "is-valid-identifier" {
  declare function isValidIdentifier(
    identifier: string,
    strict?: boolean
  ): boolean;

  export default isValidIdentifier;
}
