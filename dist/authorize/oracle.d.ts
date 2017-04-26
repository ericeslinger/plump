import { AuthorizerDefinition, RelationshipAuthorizeArguments } from './dataTypes';
import { ModelSchema, ModelReference, ModelData, IndefiniteModelData } from '../dataTypes';
export declare function Or(...args: Promise<boolean>[]): Promise<boolean>;
export declare function And(...args: Promise<boolean>[]): Promise<boolean>;
export declare class Oracle {
    private authorizers;
    addAuthorizer(auth: AuthorizerDefinition, forType: ModelSchema): void;
    authorizeAttributesCreate(actor: ModelReference, item: ModelReference, data: IndefiniteModelData): any;
    authorizeAttributesRead(actor: ModelReference, item: ModelReference): any;
    authorizeAttributesUpdate(actor: ModelReference, item: ModelReference, data: ModelData): any;
    authorizeAttributesDelete(actor: ModelReference, item: ModelReference): any;
    authorizeRelationshipCreate(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
    authorizeRelationshipRead(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
    authorizeRelationshipUpdate(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
    authorizeRelationshipDelete(actor: ModelReference, opts: RelationshipAuthorizeArguments): any;
}
