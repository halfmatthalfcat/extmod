import { z } from "zod";

const makePath = (arr: Array<string | number>): string => {
  let path = "";
  for (const part of arr) {
    if (typeof part === "string" && path) {
      path += `.${part}`;
    } else if (typeof part === "number" && path) {
      path = `${path}[${part}]`;
    } else {
      path = part.toString();
    }
  }
  return path;
};

const errorMap: z.ZodErrorMap = (issue) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message: `${makePath(issue.path)}: expected ${issue.expected}, found ${
          issue.received
        }`,
      };
    case z.ZodIssueCode.invalid_enum_value:
      return {
        message: `${makePath(issue.path)}: invalid option ${issue.received}`,
      };
    default:
      return {
        message: `${makePath(issue.path)}: ${issue.message}`,
      };
  }
};

const schema = z.object(
  {
    version: z.enum(["1.0"]),
    // For maintainence, aliases provide an easier way of updating resources
    aliases: z.record(z.string().regex(/^https?/)),
    // Policy directly correlates to Node Module Permission schema
    policy: z.object({
      dependencies: z.record(z.string(), z.boolean()),
      resources: z.record(
        z.string().regex(/^https?/),
        z.object({
          dependencies: z.boolean(),
          integrity: z.union([
            z.string(),
            z.boolean()
          ]).optional(),
        })
      ),
      scopes: z.record(
        z.object({
          dependencies: z.boolean(),
          integrity: z.boolean(),
        })
      ),
    }),
  },
  { errorMap }
);

export const validate = async <T extends object>(obj: T) =>
  schema.safeParseAsync(obj, { errorMap }).then((result) => {
    if (result.success) {
      return [];
    } else {
      return result.error.issues.map(({ message }) => message);
    }
  });

export type ExtmodConfig = z.infer<typeof schema>;

export default schema;
