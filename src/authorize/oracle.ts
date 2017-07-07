import {
  AuthorizerDefinition,
  AuthorizeRequest,
  AuthorizeResponse,
  FinalAuthorizeResponse,
  KeyService,
} from './dataTypes';

export class Oracle {
  public authorizers: { [name: string]: AuthorizerDefinition } = {};

  constructor(public keyService?: KeyService) {}

  addAuthorizer(auth: AuthorizerDefinition, forType: string) {
    this.authorizers[forType] = auth;
  }

  dispatch(request: AuthorizeRequest): Promise<FinalAuthorizeResponse> {
    return Promise.resolve()
      .then<AuthorizeResponse>(() => {
        if (request.kind === 'relationship') {
          return this.authorizers[request.parent.type].authorize(request);
        } else if (request.kind === 'attributes') {
          return this.authorizers[request.target.type].authorize(request);
        } else if (request.kind === 'compound') {
          return Promise.all(request.list.map(v => this.dispatch(v)))
            .then(
              (res: FinalAuthorizeResponse[]) =>
                request.combinator === 'or'
                  ? res.some(v => v.result)
                  : res.every(v => v.result),
            )
            .then<FinalAuthorizeResponse>(f => ({ kind: 'final', result: f }));
        }
      })
      .then(v => {
        if (v.kind === 'final') {
          return v;
        } else if (v.kind === 'delegated') {
          return this.dispatch(v.delegate);
        }
      });
  }

  authorize(request: AuthorizeRequest): Promise<boolean> {
    return this.dispatch(request).then((f: FinalAuthorizeResponse) => f.result);
  }
}
