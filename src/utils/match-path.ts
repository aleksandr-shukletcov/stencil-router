import pathToRegexp from 'path-to-regexp';

interface CompileOptions {
  end: boolean,
  strict: boolean
}

export interface MatchOptions {
  path?: string
  exact?: boolean
  strict?: boolean
}

export interface MatchResults {
  path: string,
  url: string,
  isExact: boolean,
  params: {
    [key: string]: string
  }
}

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

// Memoized function for creating the path match regex
function compilePath(pattern: string, options: CompileOptions) {
  const cacheKey = `${options.end}${options.strict}`;
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

  if (cache[pattern]) {
    return cache[pattern];
  }

  const keys = [];
  const re = pathToRegexp(pattern, keys, options);
  const compiledPattern = { re, keys };

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern;
    cacheCount += 1;
  }

  return compiledPattern;
}

/**
 * Public API for matching a URL pathname to a path pattern.
 */
export default function matchPath(pathname: string, options: MatchOptions = {}): null | MatchResults {
  if (typeof options === 'string') {
    options = { path: options };
  }

  const { path = '/', exact = false, strict = false } = options;
  const { re, keys } = compilePath(path, { end: exact, strict });
  const match = re.exec(pathname);

  if (!match) {
    return null;
  }

  const [ url, ...values ] = match;
  const isExact = pathname === url;

  if (exact && !isExact) {
    return null;
  }

  return <MatchResults>{
    path, // the path pattern used to match
    url: path === '/' && url === '' ? '/' : url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index]
      return memo
    }, {})
  };
}