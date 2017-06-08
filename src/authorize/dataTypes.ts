import { ModelReference, IndefiniteModelData, ModelData } from '../dataTypes';

export interface AbstractAuthorizeRequest {
  kind: 'attributes' | 'relationship' | 'compound';
}

export interface AbstractAttributesAuthorizeRequest extends AbstractAuthorizeRequest {
  action: 'create' | 'read' | 'update' | 'delete';
  kind: 'attributes';
  actor: ModelReference;
}

export interface AttributesReadAuthorizeRequest extends AbstractAttributesAuthorizeRequest {
  action: 'read';
  target: ModelReference;
}

export interface AttributesDeleteAuthorizeRequest extends AbstractAttributesAuthorizeRequest {
  action: 'delete';
  target: ModelReference;
}

export interface AttributesCreateAuthorizeRequest extends AbstractAttributesAuthorizeRequest {
  action: 'create';
  data?: IndefiniteModelData;
}

export interface AttributesUpdateAuthorizeRequest extends AbstractAttributesAuthorizeRequest {
  action: 'update';
  target: ModelReference;
  data?: ModelData;
}

export type AttributesAuthorizeRequest
  = AttributesCreateAuthorizeRequest
  | AttributesReadAuthorizeRequest
  | AttributesUpdateAuthorizeRequest
  | AttributesDeleteAuthorizeRequest;

export interface AbstractRelationshipAuthorizeRequest extends AbstractAuthorizeRequest {
  kind: 'relationship';
  action: 'create' | 'read' | 'update' | 'delete';
  actor: ModelData;
  relationship: string;
  parent: ModelReference;
}

export interface RelationshipCreateAuthorizeRequest extends AbstractRelationshipAuthorizeRequest {
  action: 'create';
  child: ModelReference;
  meta?: any;
}

export interface RelationshipReadAuthorizeRequest extends AbstractRelationshipAuthorizeRequest {
  action: 'read';
}

export interface RelationshipUpdateAuthorizeRequest extends AbstractRelationshipAuthorizeRequest {
  action: 'update';
  child: ModelReference;
  meta?: any;
}

export interface RelationshipDeleteAuthorizeRequest extends AbstractRelationshipAuthorizeRequest {
  action: 'delete';
  child: ModelReference;
}

export type RelationshipAuthorizeRequest
  = RelationshipCreateAuthorizeRequest
  | RelationshipReadAuthorizeRequest
  | RelationshipUpdateAuthorizeRequest
  | RelationshipDeleteAuthorizeRequest;

export type SimpleAuthorizeRequest
  = RelationshipAuthorizeRequest
  | AttributesAuthorizeRequest;


export interface CompoundAuthorizeRequest extends AbstractAuthorizeRequest {
  kind: 'compound';
  combinator: 'and' | 'or';
  list: (AttributesAuthorizeRequest | RelationshipAuthorizeRequest | CompoundAuthorizeRequest)[];
}

export type AuthorizeRequest = RelationshipAuthorizeRequest | AttributesAuthorizeRequest | CompoundAuthorizeRequest;

export interface AbstractAuthorizeResponse {
  kind: string;
}

export interface FinalAuthorizeResponse extends AbstractAuthorizeResponse {
  kind: 'final';
  result: boolean;
}

export interface DelegateAuthorizeResponse extends AbstractAuthorizeResponse {
  kind: 'delegated';
  delegate: AuthorizeRequest;
}

export type AuthorizeResponse
  = FinalAuthorizeResponse
  | DelegateAuthorizeResponse;

export interface AttributesAuthorize {
  authorizeCreate(AttributesCreateAuthorizeRequest): Promise<AuthorizeResponse>;
  authorizeRead(AttributesReadAuthorizeRequest): Promise<AuthorizeResponse>;
  authorizeUpdate(AttributesUpdateAuthorizeRequest): Promise<AuthorizeResponse>;
  authorizeDelete(AttributesDeleteAuthorizeRequest): Promise<AuthorizeResponse>;
}

export interface RelationshipAuthorize {
  authorizeCreate(RelationshipCreateAuthorizeRequest): Promise<AuthorizeResponse>;
  authorizeRead(RelationshipReadAuthorizeRequest): Promise<AuthorizeResponse>;
  authorizeUpdate(RelationshipUpdateAuthorizeRequest): Promise<AuthorizeResponse>;
  authorizeDelete(RelationshipDeleteAuthorizeRequest): Promise<AuthorizeResponse>;
}

export interface AuthorizerDefinition {
  attributes: AttributesAuthorize;
  relationships: {
    [name: string]: RelationshipAuthorize
  };
}

export interface KeyService {
  test(key: string): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, val: T): Promise<T | null>;
}
