import { ModelReference, IndefiniteModelData, ModelData } from '../dataTypes';

export interface AttributesAuthorize {
  authorizeCreate(actor: ModelReference, item: ModelReference, data: IndefiniteModelData);
  authorizeRead(actor: ModelReference, item: ModelReference);
  authorizeUpdate(actor: ModelReference, item: ModelReference, data: ModelData);
  authorizeDelete(actor: ModelReference, item: ModelReference);
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
  authorizeCreate(actor: ModelReference, opts: RelationshipAuthorizeArguments);
  authorizeRead(actor: ModelReference, opts: RelationshipAuthorizeArguments);
  authorizeUpdate(actor: ModelReference, opts: RelationshipAuthorizeArguments);
  authorizeDelete(actor: ModelReference, opts: RelationshipAuthorizeArguments);
}

export interface AuthorizerDefinition {
  typeName: string;
  attributes: AttributesAuthorize;
  relationships: {
    [name: string]: RelationshipAuthorize
  };
}

export interface AuthorizeReturn {
  or?: AuthorizeReturn[];
  and?: AuthorizeReturn[];
  actual?: boolean;
  final: boolean;
}
