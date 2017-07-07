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
var rxjs_1 = require("rxjs");
var PlumpObservable = (function (_super) {
    __extends(PlumpObservable, _super);
    function PlumpObservable(plump, observable) {
        var _this = _super.call(this) || this;
        _this.plump = plump;
        _this.source = observable;
        return _this;
    }
    PlumpObservable.prototype.lift = function (operator) {
        var observable = new PlumpObservable(this.plump, this);
        observable.operator = operator;
        return observable;
    };
    PlumpObservable.prototype.inflateRelationship = function (relName) {
        var _this = this;
        return rxjs_1.Observable.create(function (subscriber) {
            var source = _this;
            var subscription = source.subscribe(function (value) {
                try {
                    if (value && value.relationships && value.relationships[relName]) {
                        rxjs_1.Observable.combineLatest(value.relationships[relName].map(function (v) {
                            return _this.plump.find(v).asObservable();
                        })).subscribe(function (v) { return subscriber.next(v); });
                    }
                    else {
                        subscriber.next([]);
                    }
                }
                catch (err) {
                    subscriber.error(err);
                }
            }, function (err) { return subscriber.error(err); }, function () { return subscriber.complete(); });
            return subscription;
        });
    };
    return PlumpObservable;
}(rxjs_1.Observable));
exports.PlumpObservable = PlumpObservable;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVtcE9ic2VydmFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNkJBQTRDO0FBSTVDO0lBQTBELG1DQUFhO0lBQ3JFLHlCQUFtQixLQUFZLEVBQUUsVUFBVTtRQUEzQyxZQUNFLGlCQUFPLFNBRVI7UUFIa0IsV0FBSyxHQUFMLEtBQUssQ0FBTztRQUU3QixLQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQzs7SUFDM0IsQ0FBQztJQUVELDhCQUFJLEdBQUosVUFBSyxRQUFRO1FBQ1gsSUFBTSxVQUFVLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxVQUFVLENBQUMsUUFBUSxHQUFHLFFBQTRCLENBQUM7UUFDbkQsTUFBTSxDQUFDLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBRUQsNkNBQW1CLEdBQW5CLFVBQW9CLE9BQWU7UUFBbkMsaUJBZ0NDO1FBL0JDLE1BQU0sQ0FBQyxpQkFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFBLFVBQVU7WUFFakMsSUFBSSxNQUFNLEdBQUcsS0FBSSxDQUFDO1lBR2xCLElBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQ2pDLFVBQUEsS0FBSztnQkFFSCxJQUFJLENBQUM7b0JBQ0gsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2pFLGlCQUFVLENBQUMsYUFBYSxDQUN0QixLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQWlCOzRCQUNqRCxPQUFBLEtBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRTt3QkFBakMsQ0FBaUMsQ0FDbEMsQ0FDRixDQUFDLFNBQVMsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQWxCLENBQWtCLENBQUMsQ0FBQztvQkFDdkMsQ0FBQztvQkFBQyxJQUFJLENBQUMsQ0FBQzt3QkFDTixVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN0QixDQUFDO2dCQUNILENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDYixVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixDQUFDO1lBQ0gsQ0FBQyxFQUdELFVBQUEsR0FBRyxJQUFJLE9BQUEsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBckIsQ0FBcUIsRUFDNUIsY0FBTSxPQUFBLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBckIsQ0FBcUIsQ0FDNUIsQ0FBQztZQUdGLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQTdDQSxBQTZDQyxDQTdDeUQsaUJBQVUsR0E2Q25FO0FBN0NZLDBDQUFlIiwiZmlsZSI6InBsdW1wT2JzZXJ2YWJsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIE9wZXJhdG9yIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBNb2RlbERhdGEsIE1vZGVsUmVmZXJlbmNlIH0gZnJvbSAnLi9kYXRhVHlwZXMnO1xuaW1wb3J0IHsgUGx1bXAgfSBmcm9tICcuL3BsdW1wJztcblxuZXhwb3J0IGNsYXNzIFBsdW1wT2JzZXJ2YWJsZTxUIGV4dGVuZHMgTW9kZWxEYXRhPiBleHRlbmRzIE9ic2VydmFibGU8VD4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcGx1bXA6IFBsdW1wLCBvYnNlcnZhYmxlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNvdXJjZSA9IG9ic2VydmFibGU7XG4gIH1cblxuICBsaWZ0KG9wZXJhdG9yKSB7XG4gICAgY29uc3Qgb2JzZXJ2YWJsZSA9IG5ldyBQbHVtcE9ic2VydmFibGUodGhpcy5wbHVtcCwgdGhpcyk7XG4gICAgb2JzZXJ2YWJsZS5vcGVyYXRvciA9IG9wZXJhdG9yIGFzIE9wZXJhdG9yPFQsIGFueT47XG4gICAgcmV0dXJuIG9ic2VydmFibGU7XG4gIH1cblxuICBpbmZsYXRlUmVsYXRpb25zaGlwKHJlbE5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmNyZWF0ZShzdWJzY3JpYmVyID0+IHtcbiAgICAgIC8vIGJlY2F1c2Ugd2UncmUgaW4gYW4gYXJyb3cgZnVuY3Rpb24gYHRoaXNgIGlzIGZyb20gdGhlIG91dGVyIHNjb3BlLlxuICAgICAgbGV0IHNvdXJjZSA9IHRoaXM7XG5cbiAgICAgIC8vIHNhdmUgb3VyIGlubmVyIHN1YnNjcmlwdGlvblxuICAgICAgbGV0IHN1YnNjcmlwdGlvbiA9IHNvdXJjZS5zdWJzY3JpYmUoXG4gICAgICAgIHZhbHVlID0+IHtcbiAgICAgICAgICAvLyBpbXBvcnRhbnQ6IGNhdGNoIGVycm9ycyBmcm9tIHVzZXItcHJvdmlkZWQgY2FsbGJhY2tzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5yZWxhdGlvbnNoaXBzICYmIHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pIHtcbiAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KFxuICAgICAgICAgICAgICAgIHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0ubWFwKCh2OiBNb2RlbFJlZmVyZW5jZSkgPT5cbiAgICAgICAgICAgICAgICAgIHRoaXMucGx1bXAuZmluZCh2KS5hc09ic2VydmFibGUoKSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLnN1YnNjcmliZSh2ID0+IHN1YnNjcmliZXIubmV4dCh2KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdWJzY3JpYmVyLm5leHQoW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgc3Vic2NyaWJlci5lcnJvcihlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gYmUgc3VyZSB0byBoYW5kbGUgZXJyb3JzIGFuZCBjb21wbGV0aW9ucyBhcyBhcHByb3ByaWF0ZSBhbmRcbiAgICAgICAgLy8gc2VuZCB0aGVtIGFsb25nXG4gICAgICAgIGVyciA9PiBzdWJzY3JpYmVyLmVycm9yKGVyciksXG4gICAgICAgICgpID0+IHN1YnNjcmliZXIuY29tcGxldGUoKSxcbiAgICAgICk7XG5cbiAgICAgIC8vIHRvIHJldHVybiBub3dcbiAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
