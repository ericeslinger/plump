import * as chai from 'chai';

import {
  AuthorizerDefinition,
  RelationshipAuthorize,
  RelationshipAuthorizeRequest,
  AttributesUpdateAuthorizeRequest,
  DelegateAuthorizeResponse,
  SimpleAuthorizeRequest,
  AuthorizeResponse
} from '../src/authorize/dataTypes';

import { TestType } from './testType';
import { Oracle } from '../src/authorize/oracle';

const expect = chai.expect;

const good: AuthorizeResponse = {
  kind: 'final',
  result: true,
};

const bad: AuthorizeResponse = {
  kind: 'final',
  result: false,
};

function authTest(request: SimpleAuthorizeRequest): Promise<AuthorizeResponse> {
  if (request.actor.id === 1) {
    return Promise.resolve(good);
  } else if (request.actor.id === 2) {
    return Promise.resolve(bad);
  } else if (request.actor.id === 3) {
    if (request.action === 'read') {
      return Promise.resolve(good);
    } else if ((request.kind === 'attributes') && (request.action === 'update') && (request.target.id === 3)) {
      return Promise.resolve(good);
    } else {
      return Promise.resolve(bad);
    }
  } else {
    return Promise.resolve(bad);
  }
}

const auther = {
  authorizeCreate: authTest,
  authorizeRead: authTest,
  authorizeUpdate: authTest,
  authorizeDelete: authTest,
};

const incompleteAuthorizer: AuthorizerDefinition = {
  attributes: auther,
  relationships: {
    children: auther,
  }
};

const completeAuthorizer: AuthorizerDefinition = {
  attributes: auther,
  relationships: {
    children: auther,
    parents: auther,
    valenceChildren: auther,
    valenceParents: auther,
    queryChildren: auther,
    queryParents: auther,
  }
};

describe('Authorization Oracle', () => {
  describe('Setup', () => {
    it('requires all child fields', () => {
      const oracle = new Oracle();
      const testAdd = (a) => () => oracle.addAuthorizer(a, TestType.schema);
      expect(testAdd(incompleteAuthorizer)).to.throw(Error, /Missing relationship/);
      expect(testAdd(completeAuthorizer)).to.not.throw;  // tslint:disable-line no-unused-expression
    });
  });

  describe('Basic tests', () => {
    it('does basic passing attributes tests', () => {
      const oracle = new Oracle();
      oracle.addAuthorizer(completeAuthorizer, TestType.schema);
      const person = { id: 1, type: 'profiles' };

      return Promise.all(
        [
          oracle.authorize({
            action: 'create',
            kind: 'attributes',
            actor: person,
            data: { type: 'tests' },
          }),
          oracle.authorize({
            action: 'read',
            kind: 'attributes',
            actor: person,
            target: { type: 'tests', id: 1 },
          }),
          oracle.authorize({
            action: 'update',
            kind: 'attributes',
            actor: person,
            target: { type: 'tests', id: 1 },
            data: { type: 'tests', id: 1, attributes: {} },
          }),
          oracle.authorize({
            action: 'delete',
            kind: 'attributes',
            actor: person,
            target: { type: 'tests', id: 1 },
          })
        ]
      ).then(vals => expect(vals.every(v => v)).to.equal(true));
    });

    it('does basic failing attributes tests', () => {
      const oracle = new Oracle();
      oracle.addAuthorizer(completeAuthorizer, TestType.schema);
      const person = { id: 2, type: 'profiles' };

      return Promise.all(
        [
          oracle.authorize({
            action: 'create',
            kind: 'attributes',
            actor: person,
            data: { type: 'tests' },
          }),
          oracle.authorize({
            action: 'read',
            kind: 'attributes',
            actor: person,
            target: { type: 'tests', id: 1 },
          }),
          oracle.authorize({
            action: 'update',
            kind: 'attributes',
            actor: person,
            target: { type: 'tests', id: 1 },
            data: { type: 'tests', id: 1, attributes: {} },
          }),
          oracle.authorize({
            action: 'delete',
            kind: 'attributes',
            actor: person,
            target: { type: 'tests', id: 1 },
          })
        ]
      ).then(vals => expect(vals.every(v => v === false)).to.equal(true));
    });

    it('does basic passing relationships tests', () => {
      const oracle = new Oracle();
      oracle.addAuthorizer(completeAuthorizer, TestType.schema);
      const person = { id: 1, type: 'profiles' };
      return Promise.all(
        [
          oracle.authorize({
            action: 'create',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'read',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'update',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'delete',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          })
        ]
      ).then(vals => expect(vals.every(v => v)).to.equal(true));
    });

    it('does basic failing relationships tests', () => {
      const oracle = new Oracle();
      oracle.addAuthorizer(completeAuthorizer, TestType.schema);
      const person = { id: 2, type: 'profiles' };
      return Promise.all(
        [
          oracle.authorize({
            action: 'create',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'read',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'update',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'delete',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          })
        ]
      ).then(vals => expect(vals.every(v => v === false)).to.equal(true));
    });
  });

  describe('Delegated Tests', () => {

    it ('handles delegated tests', () => {
      const oracle = new Oracle();
      function delegatedAuthorizerTest(request: RelationshipAuthorizeRequest): Promise<AuthorizeResponse> {
        if (request.action === 'update') {
          return authTest(request);
        } else {
          const rV: AttributesUpdateAuthorizeRequest = {
            kind: 'attributes',
            target: request.parent,
            action: 'update',
            actor: request.actor,
            data: request.parent,
          };
          return Promise.resolve<DelegateAuthorizeResponse>({
            kind: 'delegated',
            delegate: rV,
          });
        }
      }
      const delegatedAuthorizer: RelationshipAuthorize = {
        authorizeCreate: delegatedAuthorizerTest,
        authorizeRead: delegatedAuthorizerTest,
        authorizeUpdate: delegatedAuthorizerTest,
        authorizeDelete: delegatedAuthorizerTest,
      };
      oracle.addAuthorizer({
        attributes: auther,
        relationships: {
          children: delegatedAuthorizer,
          parents: delegatedAuthorizer,
          valenceChildren: delegatedAuthorizer,
          valenceParents: delegatedAuthorizer,
          queryChildren: delegatedAuthorizer,
          queryParents: delegatedAuthorizer,
        }
      }, TestType.schema);

      const person = { id: 3, type: 'profiles' };
      return Promise.all(
        [
          oracle.authorize({
            action: 'create',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'read',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'update',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            meta: { perm: 1 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'delete',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          })
        ]
      ).then(vals => expect(vals).to.deep.equal([ false, false, false, false ]));

    });
    it ('handles compound tests', () => {
      const oracle = new Oracle();
      function compoundAuthorizerTest(request: RelationshipAuthorizeRequest): Promise<AuthorizeResponse> {
        if (request.action === 'create') {
          return Promise.resolve<DelegateAuthorizeResponse>({
            kind: 'delegated',
            delegate: {
              kind: 'compound',
              combinator: 'or',
              list: [{
                 kind: 'compound',
                 combinator: 'and',
                 list: [
                   { kind: 'attributes', target: request.parent, action: 'update', actor: request.actor },
                   { kind: 'attributes', target: request.child, action: 'read', actor: request.actor }
                 ],
               }, {
                kind: 'compound',
                combinator: 'and',
                list: [
                  { kind: 'attributes', target: request.child, action: 'update', actor: request.actor },
                  { kind: 'attributes', target: request.parent, action: 'read', actor: request.actor }
                ],
              }],
            }
          });
        } else if (request.action === 'read') {
          return Promise.resolve<DelegateAuthorizeResponse>({
            kind: 'delegated',
            delegate: { kind: 'attributes', target: request.parent, action: 'read', actor: request.actor },
          });
        } else if (request.action === 'update') {
          return Promise.resolve<DelegateAuthorizeResponse>({
            kind: 'delegated',
            delegate: { kind: 'attributes', target: request.parent, action: 'update', actor: request.actor },
          });
        } else if (request.action === 'delete') {
          return Promise.resolve<DelegateAuthorizeResponse>({
            kind: 'delegated',
            delegate: { kind: 'attributes', target: request.parent, action: 'update', actor: request.actor },
          });
        }
      }
      const delegatedAuthorizer: RelationshipAuthorize = {
        authorizeCreate: compoundAuthorizerTest,
        authorizeRead: compoundAuthorizerTest,
        authorizeUpdate: compoundAuthorizerTest,
        authorizeDelete: compoundAuthorizerTest,
      };

      oracle.addAuthorizer({
        attributes: auther,
        relationships: {
          children: delegatedAuthorizer,
          parents: delegatedAuthorizer,
          valenceChildren: delegatedAuthorizer,
          valenceParents: delegatedAuthorizer,
          queryChildren: delegatedAuthorizer,
          queryParents: delegatedAuthorizer,
        }
      }, TestType.schema);

      const person = { id: 3, type: 'profiles' };
      // return oracle.authorize({
      //   action: 'create',
      //   kind: 'relationship',
      //   actor: person,
      //   parent: { type: 'tests', id: 1 },
      //   child: { type: 'tests', id: 3 },
      //   relationship: 'children',
      // }).then((v) => expect(v).to.equal(true));
      return Promise.all(
        [
          oracle.authorize({
            action: 'create',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 3 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'read',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'update',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            meta: { perm: 1 },
            relationship: 'children',
          }),
          oracle.authorize({
            action: 'delete',
            kind: 'relationship',
            actor: person,
            parent: { type: 'tests', id: 1 },
            child: { type: 'tests', id: 2 },
            relationship: 'children',
          })
        ]
      ).then(vals => expect(vals).to.deep.equal([ true, true, false, false ]));
    });
  });

});
