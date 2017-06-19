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
                        rxjs_1.Observable.combineLatest(value.relationships[relName].map(function (v) { return _this.plump.find(v).asObservable(); })).subscribe(function (v) { return subscriber.next(v); });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVtcE9ic2VydmFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNkJBQWtDO0FBSWxDO0lBQTBELG1DQUFhO0lBRXJFLHlCQUFtQixLQUFZLEVBQUUsVUFBVTtRQUEzQyxZQUNFLGlCQUFPLFNBRVI7UUFIa0IsV0FBSyxHQUFMLEtBQUssQ0FBTztRQUU3QixLQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQzs7SUFDM0IsQ0FBQztJQUVELDhCQUFJLEdBQUosVUFBSyxRQUFRO1FBQ1gsSUFBTSxVQUFVLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxVQUFVLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCw2Q0FBbUIsR0FBbkIsVUFBb0IsT0FBZTtRQUFuQyxpQkE0QkM7UUEzQkMsTUFBTSxDQUFDLGlCQUFVLENBQUMsTUFBTSxDQUFDLFVBQUEsVUFBVTtZQUVqQyxJQUFJLE1BQU0sR0FBRyxLQUFJLENBQUM7WUFHbEIsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFBLEtBQUs7Z0JBRXZDLElBQUksQ0FBQztvQkFDSCxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakUsaUJBQVUsQ0FBQyxhQUFhLENBQ3RCLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBaUIsSUFBSyxPQUFBLEtBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFqQyxDQUFpQyxDQUFDLENBQzNGLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFDO29CQUN6QyxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0gsQ0FBQztnQkFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNiLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7WUFDSCxDQUFDLEVBR0QsVUFBQSxHQUFHLElBQUksT0FBQSxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFyQixDQUFxQixFQUM1QixjQUFNLE9BQUEsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFyQixDQUFxQixDQUFDLENBQUM7WUFHN0IsTUFBTSxDQUFDLFlBQVksQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxzQkFBQztBQUFELENBMUNBLEFBMENDLENBMUN5RCxpQkFBVSxHQTBDbkU7QUExQ1ksMENBQWUiLCJmaWxlIjoicGx1bXBPYnNlcnZhYmxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgTW9kZWxEYXRhLCBNb2RlbFJlZmVyZW5jZSB9IGZyb20gJy4vZGF0YVR5cGVzJztcbmltcG9ydCB7IFBsdW1wIH0gZnJvbSAnLi9wbHVtcCc7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcE9ic2VydmFibGU8VCBleHRlbmRzIE1vZGVsRGF0YT4gZXh0ZW5kcyBPYnNlcnZhYmxlPFQ+IHtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcGx1bXA6IFBsdW1wLCBvYnNlcnZhYmxlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNvdXJjZSA9IG9ic2VydmFibGU7XG4gIH1cblxuICBsaWZ0KG9wZXJhdG9yKSB7XG4gICAgY29uc3Qgb2JzZXJ2YWJsZSA9IG5ldyBQbHVtcE9ic2VydmFibGUodGhpcy5wbHVtcCwgdGhpcyk7XG4gICAgb2JzZXJ2YWJsZS5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIHJldHVybiBvYnNlcnZhYmxlO1xuICB9XG5cbiAgaW5mbGF0ZVJlbGF0aW9uc2hpcChyZWxOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoc3Vic2NyaWJlciA9PiB7XG4gICAgICAvLyBiZWNhdXNlIHdlJ3JlIGluIGFuIGFycm93IGZ1bmN0aW9uIGB0aGlzYCBpcyBmcm9tIHRoZSBvdXRlciBzY29wZS5cbiAgICAgIGxldCBzb3VyY2UgPSB0aGlzO1xuXG4gICAgICAvLyBzYXZlIG91ciBpbm5lciBzdWJzY3JpcHRpb25cbiAgICAgIGxldCBzdWJzY3JpcHRpb24gPSBzb3VyY2Uuc3Vic2NyaWJlKHZhbHVlID0+IHtcbiAgICAgICAgLy8gaW1wb3J0YW50OiBjYXRjaCBlcnJvcnMgZnJvbSB1c2VyLXByb3ZpZGVkIGNhbGxiYWNrc1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5yZWxhdGlvbnNoaXBzICYmIHZhbHVlLnJlbGF0aW9uc2hpcHNbcmVsTmFtZV0pIHtcbiAgICAgICAgICAgIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcbiAgICAgICAgICAgICAgdmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5tYXAoKHY6IE1vZGVsUmVmZXJlbmNlKSA9PiB0aGlzLnBsdW1wLmZpbmQodikuYXNPYnNlcnZhYmxlKCkpXG4gICAgICAgICAgICApLnN1YnNjcmliZSgodikgPT4gc3Vic2NyaWJlci5uZXh0KHYpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3Vic2NyaWJlci5uZXh0KFtdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHN1YnNjcmliZXIuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIGJlIHN1cmUgdG8gaGFuZGxlIGVycm9ycyBhbmQgY29tcGxldGlvbnMgYXMgYXBwcm9wcmlhdGUgYW5kXG4gICAgICAvLyBzZW5kIHRoZW0gYWxvbmdcbiAgICAgIGVyciA9PiBzdWJzY3JpYmVyLmVycm9yKGVyciksXG4gICAgICAoKSA9PiBzdWJzY3JpYmVyLmNvbXBsZXRlKCkpO1xuXG4gICAgICAvLyB0byByZXR1cm4gbm93XG4gICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgIH0pO1xuICB9XG59XG4iXX0=
