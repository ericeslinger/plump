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
export declare type AttributesAuthorizeRequest = AttributesCreateAuthorizeRequest | AttributesReadAuthorizeRequest | AttributesUpdateAuthorizeRequest | AttributesDeleteAuthorizeRequest;
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
export declare type RelationshipAuthorizeRequest = RelationshipCreateAuthorizeRequest | RelationshipReadAuthorizeRequest | RelationshipUpdateAuthorizeRequest | RelationshipDeleteAuthorizeRequest;
export declare type SimpleAuthorizeRequest = RelationshipAuthorizeRequest | AttributesAuthorizeRequest;
export interface CompoundAuthorizeRequest extends AbstractAuthorizeRequest {
    kind: 'compound';
    combinator: 'and' | 'or';
    list: (AttributesAuthorizeRequest | RelationshipAuthorizeRequest | CompoundAuthorizeRequest)[];
}
export declare type AuthorizeRequest = RelationshipAuthorizeRequest | AttributesAuthorizeRequest | CompoundAuthorizeRequest;
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
export declare type AuthorizeResponse = FinalAuthorizeResponse | DelegateAuthorizeResponse;
export interface AttributesAuthorize {
    authorizeCreate(AttributesCreateAuthorizeRequest: any): Promise<AuthorizeResponse>;
    authorizeRead(AttributesReadAuthorizeRequest: any): Promise<AuthorizeResponse>;
    authorizeUpdate(AttributesUpdateAuthorizeRequest: any): Promise<AuthorizeResponse>;
    authorizeDelete(AttributesDeleteAuthorizeRequest: any): Promise<AuthorizeResponse>;
}
export interface RelationshipAuthorize {
    authorizeCreate(RelationshipCreateAuthorizeRequest: any): Promise<AuthorizeResponse>;
    authorizeRead(RelationshipReadAuthorizeRequest: any): Promise<AuthorizeResponse>;
    authorizeUpdate(RelationshipUpdateAuthorizeRequest: any): Promise<AuthorizeResponse>;
    authorizeDelete(RelationshipDeleteAuthorizeRequest: any): Promise<AuthorizeResponse>;
}
export interface AuthorizerDefinition {
    attributes: AttributesAuthorize;
    relationships: {
        [name: string]: RelationshipAuthorize;
    };
}
export interface KeyService {
    test(key: string): Promise<boolean>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, val: T): Promise<T | null>;
}
