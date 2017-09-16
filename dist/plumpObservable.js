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
                            return _this.plump
                                .find(v)
                                .asObservable(['attributes', 'relationships']);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wbHVtcE9ic2VydmFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsNkJBQTRDO0FBSTVDO0lBQTBELG1DQUFhO0lBQ3JFLHlCQUFtQixLQUFZLEVBQUUsVUFBVTtRQUEzQyxZQUNFLGlCQUFPLFNBRVI7UUFIa0IsV0FBSyxHQUFMLEtBQUssQ0FBTztRQUU3QixLQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQzs7SUFDM0IsQ0FBQztJQUVELDhCQUFJLEdBQUosVUFBMEIsUUFBUTtRQUNoQyxJQUFNLFVBQVUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBa0IsQ0FBQztRQUMxRSxVQUFVLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUMvQixNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCw2Q0FBbUIsR0FBbkIsVUFBb0IsT0FBZTtRQUFuQyxpQkFrQ0M7UUFqQ0MsTUFBTSxDQUFDLGlCQUFVLENBQUMsTUFBTSxDQUFDLFVBQUEsVUFBVTtZQUVqQyxJQUFNLE1BQU0sR0FBRyxLQUFJLENBQUM7WUFHcEIsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FDbkMsVUFBQSxLQUFLO2dCQUVILElBQUksQ0FBQztvQkFDSCxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDakUsaUJBQVUsQ0FBQyxhQUFhLENBQ3RCLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBaUI7NEJBQ2pELE9BQUEsS0FBSSxDQUFDLEtBQUs7aUNBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBQztpQ0FDUCxZQUFZLENBQUMsQ0FBQyxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUM7d0JBRmhELENBRWdELENBQ2pELENBQ0YsQ0FBQyxTQUFTLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFsQixDQUFrQixDQUFDLENBQUM7b0JBQ3ZDLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ04sVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdEIsQ0FBQztnQkFDSCxDQUFDO2dCQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2IsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztZQUNILENBQUMsRUFHRCxVQUFBLEdBQUcsSUFBSSxPQUFBLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQXJCLENBQXFCLEVBQzVCLGNBQU0sT0FBQSxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQXJCLENBQXFCLENBQzVCLENBQUM7WUFHRixNQUFNLENBQUMsWUFBWSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILHNCQUFDO0FBQUQsQ0EvQ0EsQUErQ0MsQ0EvQ3lELGlCQUFVLEdBK0NuRTtBQS9DWSwwQ0FBZSIsImZpbGUiOiJwbHVtcE9ic2VydmFibGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBPcGVyYXRvciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgTW9kZWxEYXRhLCBNb2RlbFJlZmVyZW5jZSB9IGZyb20gJy4vZGF0YVR5cGVzJztcbmltcG9ydCB7IFBsdW1wIH0gZnJvbSAnLi9wbHVtcCc7XG5cbmV4cG9ydCBjbGFzcyBQbHVtcE9ic2VydmFibGU8VCBleHRlbmRzIE1vZGVsRGF0YT4gZXh0ZW5kcyBPYnNlcnZhYmxlPFQ+IHtcbiAgY29uc3RydWN0b3IocHVibGljIHBsdW1wOiBQbHVtcCwgb2JzZXJ2YWJsZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zb3VyY2UgPSBvYnNlcnZhYmxlO1xuICB9XG5cbiAgbGlmdDxVIGV4dGVuZHMgTW9kZWxEYXRhPihvcGVyYXRvcikge1xuICAgIGNvbnN0IG9ic2VydmFibGUgPSBuZXcgUGx1bXBPYnNlcnZhYmxlKHRoaXMucGx1bXAsIHRoaXMpIGFzIE9ic2VydmFibGU8VT47XG4gICAgb2JzZXJ2YWJsZS5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIHJldHVybiBvYnNlcnZhYmxlO1xuICB9XG5cbiAgaW5mbGF0ZVJlbGF0aW9uc2hpcChyZWxOYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoc3Vic2NyaWJlciA9PiB7XG4gICAgICAvLyBiZWNhdXNlIHdlJ3JlIGluIGFuIGFycm93IGZ1bmN0aW9uIGB0aGlzYCBpcyBmcm9tIHRoZSBvdXRlciBzY29wZS5cbiAgICAgIGNvbnN0IHNvdXJjZSA9IHRoaXM7XG5cbiAgICAgIC8vIHNhdmUgb3VyIGlubmVyIHN1YnNjcmlwdGlvblxuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gc291cmNlLnN1YnNjcmliZShcbiAgICAgICAgdmFsdWUgPT4ge1xuICAgICAgICAgIC8vIGltcG9ydGFudDogY2F0Y2ggZXJyb3JzIGZyb20gdXNlci1wcm92aWRlZCBjYWxsYmFja3NcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnJlbGF0aW9uc2hpcHMgJiYgdmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXSkge1xuICAgICAgICAgICAgICBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXG4gICAgICAgICAgICAgICAgdmFsdWUucmVsYXRpb25zaGlwc1tyZWxOYW1lXS5tYXAoKHY6IE1vZGVsUmVmZXJlbmNlKSA9PlxuICAgICAgICAgICAgICAgICAgdGhpcy5wbHVtcFxuICAgICAgICAgICAgICAgICAgICAuZmluZCh2KVxuICAgICAgICAgICAgICAgICAgICAuYXNPYnNlcnZhYmxlKFsnYXR0cmlidXRlcycsICdyZWxhdGlvbnNoaXBzJ10pLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICkuc3Vic2NyaWJlKHYgPT4gc3Vic2NyaWJlci5uZXh0KHYpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN1YnNjcmliZXIubmV4dChbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBzdWJzY3JpYmVyLmVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAvLyBiZSBzdXJlIHRvIGhhbmRsZSBlcnJvcnMgYW5kIGNvbXBsZXRpb25zIGFzIGFwcHJvcHJpYXRlIGFuZFxuICAgICAgICAvLyBzZW5kIHRoZW0gYWxvbmdcbiAgICAgICAgZXJyID0+IHN1YnNjcmliZXIuZXJyb3IoZXJyKSxcbiAgICAgICAgKCkgPT4gc3Vic2NyaWJlci5jb21wbGV0ZSgpLFxuICAgICAgKTtcblxuICAgICAgLy8gdG8gcmV0dXJuIG5vd1xuICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICB9KTtcbiAgfVxufVxuIl19
