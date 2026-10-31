export interface NextRequestCandidate {
  name?: string;
  pathname?: string;
}

const REQUEST_EXTENSION_REGEX = /\.(bru|yml|yaml)$/i;

const toPosix = (value: string): string => value.replace(/\\/g, '/');

const stripRequestExtension = (value: string): string => value.replace(REQUEST_EXTENSION_REGEX, '');

// Normalizes a user supplied request path: posix separators, no leading `./` or `/`,
// no duplicate separators and no request file extension.
const normalizeRequestPath = (value: string): string => {
  const posixPath = toPosix(value.trim())
    .replace(/\/{2,}/g, '/')
    .replace(/^(\.\/)+/, '')
    .replace(/^\/+/, '');

  return stripRequestExtension(posixPath);
};

// A target is treated as a path only when it can't be a plain request name lookup the
// way it always was: it contains a separator or ends with a request file extension.
// Plain names keep the historical name-based behaviour untouched.
const isRequestPathTarget =(target: unknown): target is string => {
  if (typeof target !== 'string') {
    return false;
  }

  return /[\\/]/.test(target) || REQUEST_EXTENSION_REGEX.test(target.trim());
};

const getRelativeRequestPath = (pathname: string, collectionPath: string): string | null => {
  const posixPathname = toPosix(pathname);
  const posixRoot = toPosix(collectionPath).replace(/\/+$/, '');

  if (!posixRoot || !posixPathname.startsWith(`${posixRoot}/`)) {
    return null;
  }

  return stripRequestExtension(posixPathname.slice(posixRoot.length + 1));
};

/**
 * Finds the index of the request `bru.runner.setNextRequest(target)` points to.
 *
 * `target` can be a path relative to the collection root (e.g. `folder2/Get Fact` or
 * `folder2/Get Fact.bru`) or a request name. A path is matched against the requests
 * of the current run first; if nothing matches, the name-based lookup is used, so
 * existing scripts keep working.
 *
 * @returns the index in `requests`, or -1 when no request matches
 */
export const findNextRequestIndex = (
  requests: NextRequestCandidate[],
  target: unknown,
  collectionPath: string
): number => {
  if (!Array.isArray(requests)) {
    return -1;
  }

  if (isRequestPathTarget(target) && collectionPath) {
    const targetPath = normalizeRequestPath(target);
    const pathIndex = requests.findIndex((request) => {
      if (!request?.pathname) {
        return false;
      }
      return getRelativeRequestPath(request.pathname, collectionPath) === targetPath;
    });

    if (pathIndex >= 0) {
      return pathIndex;
    }
  }

  return requests.findIndex((request) => request?.name === target);
};
