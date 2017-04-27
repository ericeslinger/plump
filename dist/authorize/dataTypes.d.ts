import { ModelReference, IndefiniteModelData, ModelData } from '../dataTypes';
export interface AttributesAuthorize {
    authorizeCreate(actor: ModelReference, item: ModelReference, data: IndefiniteModelData): any;
    authorizeRead(actor: ModelReference, item: ModelReference): any;
    authorizeUpdate(actor: ModelReference, item: ModelReference, data: ModelData): any;
    authorizeDelete(actor: ModelReference, item: ModelReference): any;
}
export interface RelationshipAuthorizeArguments {
    actor: ModelReference;
    parent: ModelReference;
    relationship: string;
    child: ModelReference;
    meta?: any;
    data?: IndefiniteModelData;
}
export interface RelationshipAuthorize {
    authorizeCreate(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
    authorizeRead(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
    authorizeUpdate(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
    authorizeDelete(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
}
export interface AuthorizerDefinition {
    typeName: string;
    attributes: AttributesAuthorize;
    relationships: {
        [name: string]: RelationshipAuthorize;
    };
}
export interface AuthorizeReturn {
    or?: AuthorizeReturn[];
    and?: AuthorizeReturn[];
    actual?: boolean;
    final: boolean;
}
