import { AuthorizerDefinition, AuthorizeRequest, AuthorizeResponse } from './dataTypes';
import { ModelSchema } from '../dataTypes';
export declare class Oracle {
    private authorizers;
    addAuthorizer(auth: AuthorizerDefinition, forType: ModelSchema): void;
    dispatch(request: AuthorizeRequest): Promise<AuthorizeResponse>;
    authorize(request: AuthorizeRequest): Promise<boolean>;
}
