import { AuthorizerDefinition, AuthorizeRequest, FinalAuthorizeResponse, KeyService } from './dataTypes';
export declare class Oracle {
    keyService: KeyService;
    authorizers: {
        [name: string]: AuthorizerDefinition;
    };
    constructor(keyService?: KeyService);
    addAuthorizer(auth: AuthorizerDefinition, forType: string): void;
    dispatch(request: AuthorizeRequest): Promise<FinalAuthorizeResponse>;
    authorize(request: AuthorizeRequest): Promise<boolean>;
}
