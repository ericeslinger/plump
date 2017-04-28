import {
  AuthorizerDefinition,
  AuthorizeRequest,
  AuthorizeResponse,
  FinalAuthorizeResponse,
} from './dataTypes';
import { ModelSchema } from '../dataTypes';

export class Oracle {
  private authorizers: {[name: string]: AuthorizerDefinition} = {};

  addAuthorizer(auth: AuthorizerDefinition, forType: ModelSchema) {
    const authKeys = Object.keys(auth.relationships);
    const forKeys = Object.keys(forType.relationships);
    const missing = forKeys.filter(k => authKeys.indexOf(k) < 0);
    if (missing.length > 0) {
      throw new Error(`Missing relationship authorizer(s) ${missing.join(', ')}`);
    }
    this.authorizers[forType.name] = auth;
  }

  dispatch(request: AuthorizeRequest): Promise<AuthorizeResponse> {
    return Promise.resolve()
    .then<AuthorizeResponse>(() => {
      if (request.kind === 'relationship') {
        const relationshipAuthorizer = this.authorizers[request.parent.typeName].relationships[request.relationship];
        if (request.action === 'create') {
          return relationshipAuthorizer.authorizeCreate(request);
        } else if (request.action === 'read') {
          return relationshipAuthorizer.authorizeRead(request);
        } else if (request.action === 'update') {
          return relationshipAuthorizer.authorizeUpdate(request);
        } else if (request.action === 'delete') {
          return relationshipAuthorizer.authorizeDelete(request);
        }
      } else if (request.kind === 'attributes') {
        if (request.action === 'create') {
          return this.authorizers[request.data.typeName].attributes.authorizeCreate(request);
        } else if (request.action === 'read') {
          return this.authorizers[request.target.typeName].attributes.authorizeRead(request);
        } else if (request.action === 'update') {
          return this.authorizers[request.target.typeName].attributes.authorizeUpdate(request);
        } else if (request.action === 'delete') {
          return this.authorizers[request.target.typeName].attributes.authorizeDelete(request);
        }
      } else if (request.kind === 'compound') {
        return Promise.all(request.list.map(v => this.dispatch(v)))
        .then((res: FinalAuthorizeResponse[]) => request.combinator === 'or' ? res.some(v => v.result) : res.every(v => v.result ))
        .then<FinalAuthorizeResponse>(f => ({ kind: 'final', result: f }));
      }
    }).then((v) => {
      if (v.kind === 'final') {
        return v;
      } else if (v.kind === 'delegated') {
        return this.dispatch(v.delegate);
      }
    });
  }

  authorize(request: AuthorizeRequest): Promise<boolean> {
    return this.dispatch(request)
    .then((f: FinalAuthorizeResponse) => f.result);
  }
}
