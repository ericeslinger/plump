import { AuthorizerDefinition, AuthorizeRequest, AuthorizeResponse, KeyService } from './dataTypes';
import { ModelSchema } from '../dataTypes';
export declare class Oracle {
    keyService: KeyService;
    private authorizers;
    constructor(keyService: KeyService);
    addAuthorizer(auth: AuthorizerDefinition, forType: ModelSchema): void;
    dispatch(request: AuthorizeRequest): Promise<AuthorizeResponse>;
    authorize(request: AuthorizeRequest): Promise<boolean>;
}
