"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("../src/model");
var relationship_1 = require("../src/relationship");
var Children = (function (_super) {
    __extends(Children, _super);
    function Children() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Children;
}(relationship_1.Relationship));
Children.schema = {
    sides: {
        parents: { otherType: 'tests', otherName: 'children' },
        children: { otherType: 'tests', otherName: 'parents' },
    },
    storeData: {
        sql: {
            tableName: 'parent_child_relationship',
            joinFields: {
                parents: 'child_id',
                children: 'parent_id',
            },
        },
    }
};
exports.Children = Children;
var ValenceChildren = (function (_super) {
    __extends(ValenceChildren, _super);
    function ValenceChildren() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ValenceChildren;
}(relationship_1.Relationship));
ValenceChildren.schema = {
    sides: {
        valenceParents: { otherType: 'tests', otherName: 'valenceChildren' },
        valenceChildren: { otherType: 'tests', otherName: 'valenceParents' },
    },
    storeData: {
        sql: {
            tableName: 'valence_children',
            joinFields: {
                valenceParents: 'child_id',
                valenceChildren: 'parent_id',
            },
        },
    },
    extras: {
        perm: {
            type: 'number',
        },
    },
};
exports.ValenceChildren = ValenceChildren;
var QueryChildren = (function (_super) {
    __extends(QueryChildren, _super);
    function QueryChildren() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueryChildren;
}(relationship_1.Relationship));
QueryChildren.schema = {
    sides: {
        queryParents: { otherType: 'tests', otherName: 'queryChildren' },
        queryChildren: { otherType: 'tests', otherName: 'queryParents' },
    },
    storeData: {
        sql: {
            tableName: 'query_children',
            joinFields: {
                queryParents: 'child_id',
                queryChildren: 'parent_id',
            },
            joinQuery: {
                queryParents: 'on "tests"."id" = "queryParents"."child_id" and "queryParents"."perm" >= 2',
                queryChildren: 'on "tests"."id" = "queryChildren"."parent_id" and "queryChildren"."perm" >= 2',
            },
            where: {
                queryParents: 'where "queryParents"."child_id" = ? and "queryParents"."perm" >= 2',
                queryChildren: 'where "queryChildren"."parent_id" = ? and "queryChildren"."perm" >= 2',
            },
        },
    },
    $extras: {
        perm: {
            type: 'number',
        },
    },
};
exports.QueryChildren = QueryChildren;
var TestType = (function (_super) {
    __extends(TestType, _super);
    function TestType() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TestType;
}(model_1.Model));
TestType.typeName = 'tests';
TestType.schema = {
    name: 'tests',
    idAttribute: 'id',
    attributes: {
        id: { type: 'number', readOnly: true },
        name: { type: 'string', readOnly: false },
        otherName: { type: 'string', default: '', readOnly: false },
        extended: { type: 'object', default: {}, readOnly: false },
    },
    relationships: {
        children: { type: Children },
        parents: { type: Children },
        valenceChildren: { type: ValenceChildren },
        valenceParents: { type: ValenceChildren },
        queryChildren: { type: QueryChildren, readOnly: true },
        queryParents: { type: QueryChildren, readOnly: true },
    },
    storeData: {
        sql: {
            tableName: 'tests',
            bulkQuery: 'where "tests"."id" >= ?',
        },
    }
};
exports.TestType = TestType;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFLLEVBQUU7UUFDekMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUU7UUFDM0QsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUU7S0FDM0Q7SUFDRCxhQUFhLEVBQUU7UUFDYixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1FBQzVCLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7UUFDM0IsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRTtRQUMxQyxjQUFjLEVBQUUsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFO1FBQ3pDLGFBQWEsRUFBRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtRQUN0RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7S0FDdEQ7SUFDRCxTQUFTLEVBQUU7UUFDVCxHQUFHLEVBQUU7WUFDSCxTQUFTLEVBQUUsT0FBTztZQUNsQixTQUFTLEVBQUUseUJBQXlCO1NBQ3JDO0tBQ0Y7Q0FDRixDQUFDO0FBekJTLDRCQUFRIiwiZmlsZSI6InRlc3RUeXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwgfSBmcm9tICcuLi9zcmMvbW9kZWwnO1xuaW1wb3J0IHsgUmVsYXRpb25zaGlwIH0gZnJvbSAnLi4vc3JjL3JlbGF0aW9uc2hpcCc7XG5cbmV4cG9ydCBjbGFzcyBDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7XG4gIHN0YXRpYyBzY2hlbWEgPSB7XG4gICAgc2lkZXM6IHtcbiAgICAgIHBhcmVudHM6IHsgb3RoZXJUeXBlOiAndGVzdHMnLCBvdGhlck5hbWU6ICdjaGlsZHJlbicgfSxcbiAgICAgIGNoaWxkcmVuOiB7IG90aGVyVHlwZTogJ3Rlc3RzJywgb3RoZXJOYW1lOiAncGFyZW50cycgfSxcbiAgICB9LFxuICAgIHN0b3JlRGF0YToge1xuICAgICAgc3FsOiB7XG4gICAgICAgIHRhYmxlTmFtZTogJ3BhcmVudF9jaGlsZF9yZWxhdGlvbnNoaXAnLFxuICAgICAgICBqb2luRmllbGRzOiB7XG4gICAgICAgICAgcGFyZW50czogJ2NoaWxkX2lkJyxcbiAgICAgICAgICBjaGlsZHJlbjogJ3BhcmVudF9pZCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIFZhbGVuY2VDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7XG4gIHN0YXRpYyBzY2hlbWEgPSB7XG4gICAgc2lkZXM6IHtcbiAgICAgIHZhbGVuY2VQYXJlbnRzOiB7IG90aGVyVHlwZTogJ3Rlc3RzJywgb3RoZXJOYW1lOiAndmFsZW5jZUNoaWxkcmVuJyB9LFxuICAgICAgdmFsZW5jZUNoaWxkcmVuOiB7IG90aGVyVHlwZTogJ3Rlc3RzJywgb3RoZXJOYW1lOiAndmFsZW5jZVBhcmVudHMnIH0sXG4gICAgfSxcbiAgICBzdG9yZURhdGE6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICB0YWJsZU5hbWU6ICd2YWxlbmNlX2NoaWxkcmVuJyxcbiAgICAgICAgam9pbkZpZWxkczoge1xuICAgICAgICAgIHZhbGVuY2VQYXJlbnRzOiAnY2hpbGRfaWQnLFxuICAgICAgICAgIHZhbGVuY2VDaGlsZHJlbjogJ3BhcmVudF9pZCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgZXh0cmFzOiB7XG4gICAgICBwZXJtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgUXVlcnlDaGlsZHJlbiBleHRlbmRzIFJlbGF0aW9uc2hpcCB7XG4gIHN0YXRpYyBzY2hlbWEgPSB7XG4gICAgc2lkZXM6IHtcbiAgICAgIHF1ZXJ5UGFyZW50czogeyBvdGhlclR5cGU6ICd0ZXN0cycsIG90aGVyTmFtZTogJ3F1ZXJ5Q2hpbGRyZW4nIH0sXG4gICAgICBxdWVyeUNoaWxkcmVuOiB7IG90aGVyVHlwZTogJ3Rlc3RzJywgb3RoZXJOYW1lOiAncXVlcnlQYXJlbnRzJyB9LFxuICAgIH0sXG4gICAgc3RvcmVEYXRhOiB7XG4gICAgICBzcWw6IHtcbiAgICAgICAgdGFibGVOYW1lOiAncXVlcnlfY2hpbGRyZW4nLFxuICAgICAgICBqb2luRmllbGRzOiB7XG4gICAgICAgICAgcXVlcnlQYXJlbnRzOiAnY2hpbGRfaWQnLFxuICAgICAgICAgIHF1ZXJ5Q2hpbGRyZW46ICdwYXJlbnRfaWQnLFxuICAgICAgICB9LFxuICAgICAgICBqb2luUXVlcnk6IHtcbiAgICAgICAgICBxdWVyeVBhcmVudHM6ICdvbiBcInRlc3RzXCIuXCJpZFwiID0gXCJxdWVyeVBhcmVudHNcIi5cImNoaWxkX2lkXCIgYW5kIFwicXVlcnlQYXJlbnRzXCIuXCJwZXJtXCIgPj0gMicsXG4gICAgICAgICAgcXVlcnlDaGlsZHJlbjogJ29uIFwidGVzdHNcIi5cImlkXCIgPSBcInF1ZXJ5Q2hpbGRyZW5cIi5cInBhcmVudF9pZFwiIGFuZCBcInF1ZXJ5Q2hpbGRyZW5cIi5cInBlcm1cIiA+PSAyJyxcbiAgICAgICAgfSxcbiAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICBxdWVyeVBhcmVudHM6ICd3aGVyZSBcInF1ZXJ5UGFyZW50c1wiLlwiY2hpbGRfaWRcIiA9ID8gYW5kIFwicXVlcnlQYXJlbnRzXCIuXCJwZXJtXCIgPj0gMicsXG4gICAgICAgICAgcXVlcnlDaGlsZHJlbjogJ3doZXJlIFwicXVlcnlDaGlsZHJlblwiLlwicGFyZW50X2lkXCIgPSA/IGFuZCBcInF1ZXJ5Q2hpbGRyZW5cIi5cInBlcm1cIiA+PSAyJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAkZXh0cmFzOiB7XG4gICAgICBwZXJtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgVGVzdFR5cGUgZXh0ZW5kcyBNb2RlbCB7XG4gIHN0YXRpYyB0eXBlTmFtZSA9ICd0ZXN0cyc7XG4gIHN0YXRpYyBzY2hlbWEgPSB7XG4gICAgbmFtZTogJ3Rlc3RzJyxcbiAgICBpZEF0dHJpYnV0ZTogJ2lkJyxcbiAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICBpZDogeyB0eXBlOiAnbnVtYmVyJywgcmVhZE9ubHk6IHRydWUgfSxcbiAgICAgIG5hbWU6IHsgdHlwZTogJ3N0cmluZycsIHJlYWRPbmx5OiBmYWxzZSB9LFxuICAgICAgb3RoZXJOYW1lOiB7IHR5cGU6ICdzdHJpbmcnLCBkZWZhdWx0OiAnJywgcmVhZE9ubHk6IGZhbHNlIH0sXG4gICAgICBleHRlbmRlZDogeyB0eXBlOiAnb2JqZWN0JywgZGVmYXVsdDoge30sIHJlYWRPbmx5OiBmYWxzZSB9LFxuICAgIH0sXG4gICAgcmVsYXRpb25zaGlwczoge1xuICAgICAgY2hpbGRyZW46IHsgdHlwZTogQ2hpbGRyZW4gfSxcbiAgICAgIHBhcmVudHM6IHsgdHlwZTogQ2hpbGRyZW4gfSxcbiAgICAgIHZhbGVuY2VDaGlsZHJlbjogeyB0eXBlOiBWYWxlbmNlQ2hpbGRyZW4gfSxcbiAgICAgIHZhbGVuY2VQYXJlbnRzOiB7IHR5cGU6IFZhbGVuY2VDaGlsZHJlbiB9LFxuICAgICAgcXVlcnlDaGlsZHJlbjogeyB0eXBlOiBRdWVyeUNoaWxkcmVuLCByZWFkT25seTogdHJ1ZSB9LFxuICAgICAgcXVlcnlQYXJlbnRzOiB7IHR5cGU6IFF1ZXJ5Q2hpbGRyZW4sIHJlYWRPbmx5OiB0cnVlIH0sXG4gICAgfSxcbiAgICBzdG9yZURhdGE6IHtcbiAgICAgIHNxbDoge1xuICAgICAgICB0YWJsZU5hbWU6ICd0ZXN0cycsXG4gICAgICAgIGJ1bGtRdWVyeTogJ3doZXJlIFwidGVzdHNcIi5cImlkXCIgPj0gPycsXG4gICAgICB9LFxuICAgIH1cbiAgfTtcbn1cbiJdfQ==
