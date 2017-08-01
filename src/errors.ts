export class NotFoundError extends Error {
  constructor() {
    super('not found');
  }
}

export class NotAuthorizedError extends Error {
  constructor() {
    super('not authorized');
  }
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super('not authenticated');
  }
}

export class UnknownError extends Error {
  constructor() {
    super('unknown');
  }
}

export type PlumpError =
  | NotFoundError
  | NotAuthorizedError
  | NotAuthorizedError
  | UnknownError;
