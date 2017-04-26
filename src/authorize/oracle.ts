import { AuthorizerDefinition, RelationshipAuthorizeArguments } from './dataTypes';
import { ModelSchema, ModelReference, ModelData, IndefiniteModelData } from '../dataTypes';

export function Or(...args: Promise<boolean>[]): Promise<boolean> {
  return Promise.all(args).then((results) => results.some(k => k));
}
export function And(...args: Promise<boolean>[]): Promise<boolean> {
  return Promise.all(args).then((results) => results.every(k => k));
}

export class Oracle {
  private authorizers: {[name: string]: AuthorizerDefinition} = {};

  addAuthorizer(auth: AuthorizerDefinition, forType: ModelSchema) {
    const authKeys = Object.keys(auth.relationships);
    const forKeys = Object.keys(forType.relationships);
    const missing = forKeys.filter(k => authKeys.indexOf(k) < 0);
    if (missing.length > 0) {
      throw new Error(`Missing relationship authorizer(s) ${missing.join(', ')}`);
    }
    this.authorizers[auth.typeName] = auth;
  }

  authorizeAttributesCreate(actor: ModelReference, item: ModelReference, data: IndefiniteModelData) {
    return this.authorizers[item.typeName].attributes.authorizeCreate(actor, item, data);
  }
  authorizeAttributesRead(actor: ModelReference, item: ModelReference) {
    return this.authorizers[item.typeName].attributes.authorizeRead(actor, item);
  }
  authorizeAttributesUpdate(actor: ModelReference, item: ModelReference, data: ModelData) {
    return this.authorizers[item.typeName].attributes.authorizeUpdate(actor, item, data);
  }
  authorizeAttributesDelete(actor: ModelReference, item: ModelReference) {
    return this.authorizers[item.typeName].attributes.authorizeDelete(actor, item);
  }


  authorizeRelationshipCreate(actor: ModelReference, opts: RelationshipAuthorizeArguments) {
    return this.authorizers[opts.parent.typeName].relationships[opts.relationship].authorizeCreate(actor, opts);
  }
  authorizeRelationshipRead(actor: ModelReference, opts: RelationshipAuthorizeArguments) {
    return this.authorizers[opts.parent.typeName].relationships[opts.relationship].authorizeRead(actor, opts);
  }
  authorizeRelationshipUpdate(actor: ModelReference, opts: RelationshipAuthorizeArguments) {
    return this.authorizers[opts.parent.typeName].relationships[opts.relationship].authorizeUpdate(actor, opts);
  }
  authorizeRelationshipDelete(actor: ModelReference, opts: RelationshipAuthorizeArguments) {
    return this.authorizers[opts.parent.typeName].relationships[opts.relationship].authorizeDelete(actor, opts);
  }
}
