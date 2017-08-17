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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVtcE9ic2VydmFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNkJBQTRDO0FBSTVDO0lBQTBELG1DQUFhO0lBQ3JFLHlCQUFtQixLQUFZLEVBQUUsVUFBVTtRQUEzQyxZQUNFLGlCQUFPLFNBRVI7UUFIa0IsV0FBSyxHQUFMLEtBQUssQ0FBTztRQUU3QixLQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQzs7SUFDM0IsQ0FBQztJQUVELDhCQUFJLEdBQUosVUFBMEIsUUFBUTtRQUNoQyxJQUFNLFVBQVUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBa0IsQ0FBQztRQUMxRSxVQUFVLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCw2Q0FBbUIsR0FBbkIsVUFBb0IsT0FBZTtRQUFuQyxpQkFnQ0M7UUEvQkMsTUFBTSxDQUFDLGlCQUFVLENBQUMsTUFBTSxDQUFDLFVBQUEsVUFBVTtZQUVqQyxJQUFJLE1BQU0sR0FBRyxLQUFJLENBQUM7WUFHbEIsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FDakMsVUFBQSxLQUFLO2dCQUVILElBQUksQ0FBQztvQkFDSCxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakUsaUJBQVUsQ0FBQyxhQUFhLENBQ3RCLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBaUI7NEJBQ2pELE9BQUEsS0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFO3dCQUFqQyxDQUFpQyxDQUNsQyxDQUNGLENBQUMsU0FBUyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFDO29CQUN2QyxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNOLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0gsQ0FBQztnQkFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNiLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7WUFDSCxDQUFDLEVBR0QsVUFBQSxHQUFHLElBQUksT0FBQSxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFyQixDQUFxQixFQUM1QixjQUFNLE9BQUEsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFyQixDQUFxQixDQUM1QixDQUFDO1lBR0YsTUFBTSxDQUFDLFlBQVksQ0FBQztRQUN0QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDSCxzQkFBQztBQUFELENBN0NBLEFBNkNDLENBN0N5RCxpQkFBVSxHQTZDbkU7QUE3Q1ksMENBQWUiLCJmaWxlIjoicGx1bXBPYnNlcnZhYmxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgT3BlcmF0b3IgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IE1vZGVsRGF0YSwgTW9kZWxSZWZlcmVuY2UgfSBmcm9tICcuL2RhdGFUeXBlcyc7XG5pbXBvcnQgeyBQbHVtcCB9IGZyb20gJy4vcGx1bXAnO1xuXG5leHBvcnQgY2xhc3MgUGx1bXBPYnNlcnZhYmxlPFQgZXh0ZW5kcyBNb2RlbERhdGE+IGV4dGVuZHMgT2JzZXJ2YWJsZTxUPiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBwbHVtcDogUGx1bXAsIG9ic2VydmFibGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuc291cmNlID0gb2JzZXJ2YWJsZTtcbiAgfVxuXG4gIGxpZnQ8VSBleHRlbmRzIE1vZGVsRGF0YT4ob3BlcmF0b3IpIHtcbiAgICBjb25zdCBvYnNlcnZhYmxlID0gbmV3IFBsdW1wT2JzZXJ2YWJsZSh0aGlzLnBsdW1wLCB0aGlzKSBhcyBPYnNlcnZhYmxlPFU+O1xuICAgIG9ic2VydmFibGUub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICByZXR1cm4gb2JzZXJ2YWJsZTtcbiAgfVxuXG4gIGluZmxhdGVSZWxhdGlvbnNoaXAocmVsTmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKHN1YnNjcmliZXIgPT4ge1xuICAgICAgLy8gYmVjYXVzZSB3ZSdyZSBpbiBhbiBhcnJvdyBmdW5jdGlvbiBgdGhpc2AgaXMgZnJvbSB0aGUgb3V0ZXIgc2NvcGUuXG4gICAgICBsZXQgc291cmNlID0gdGhpcztcblxuICAgICAgLy8gc2F2ZSBvdXIgaW5uZXIgc3Vic2NyaXB0aW9uXG4gICAgICBsZXQgc3Vic2NyaXB0aW9uID0gc291cmNlLnN1YnNjcmliZShcbiAgICAgICAgdmFsdWUgPT4ge1xuICAgICAgICAgIC8vIGltcG9ydGFudDogY2F0Y2ggZXJyb3JzIGZyb20gdXNlci1wcm92aWRlZCBjYWxsYmFja3NcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnJlbGF0aW9uc2hpcHMgJiYgdmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkge1xuICAgICAgICAgICAgICBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXG4gICAgICAgICAgICAgICAgdmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5tYXAoKHY6IE1vZGVsUmVmZXJlbmNlKSA9PlxuICAgICAgICAgICAgICAgICAgdGhpcy5wbHVtcC5maW5kKHYpLmFzT2JzZXJ2YWJsZSgpLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICkuc3Vic2NyaWJlKHYgPT4gc3Vic2NyaWJlci5uZXh0KHYpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN1YnNjcmliZXIubmV4dChbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBzdWJzY3JpYmVyLmVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBiZSBzdXJlIHRvIGhhbmRsZSBlcnJvcnMgYW5kIGNvbXBsZXRpb25zIGFzIGFwcHJvcHJpYXRlIGFuZFxuICAgICAgICAvLyBzZW5kIHRoZW0gYWxvbmdcbiAgICAgICAgZXJyID0+IHN1YnNjcmliZXIuZXJyb3IoZXJyKSxcbiAgICAgICAgKCkgPT4gc3Vic2NyaWJlci5jb21wbGV0ZSgpLFxuICAgICAgKTtcblxuICAgICAgLy8gdG8gcmV0dXJuIG5vd1xuICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICB9KTtcbiAgfVxufVxuIl19
