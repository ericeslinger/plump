/* eslint-env node, mocha*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var Bluebird = require("bluebird");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var index_1 = require("../src/index");
var testType_1 = require("./testType");
Bluebird.config({
    longStackTraces: true,
});
chai.use(chaiAsPromised);
var expect = chai.expect;
describe('Plump', function () {
    it('should properly use hot and cold caches', function (done) {
        var DelayProxy = {
            get: function (target, name) {
                if (['read', 'write', 'add', 'remove'].indexOf(name) >= 0) {
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return Bluebird.delay(200)
                            .then(function () { return target[name].apply(target, args); });
                    };
                }
                else {
                    return target[name];
                }
            },
        };
        var terminalStore = new index_1.MemoryStore({ terminal: true });
        var delayedMemstore = new Proxy(terminalStore, DelayProxy);
        var coldMemstore = new index_1.MemoryStore();
        var hotMemstore = new index_1.MemoryStore();
        hotMemstore.hot = function () { return true; };
        var otherPlump = new index_1.Plump({
            storage: [hotMemstore, coldMemstore, delayedMemstore],
            types: [testType_1.TestType],
        });
        var invalidated = new testType_1.TestType({ name: 'foo' }, otherPlump);
        invalidated.save()
            .then(function () {
            var phase = 0;
            var newOne = otherPlump.find('tests', invalidated.id);
            var subscription = newOne.subscribe({
                next: function (v) {
                    try {
                        if (phase === 0) {
                            if (v.attributes.name) {
                                expect(v).to.have.property('attributes').with.property('name', 'foo');
                                phase = 1;
                            }
                        }
                        if (phase === 1) {
                            if (v.attributes.name === 'slowtato') {
                                phase = 2;
                            }
                            else if (v.attributes.name === 'grotato') {
                                subscription.unsubscribe();
                                done();
                            }
                        }
                        if (phase === 2) {
                            if (v.attributes.name !== 'slowtato') {
                                expect(v).to.have.property('attributes').with.property('name', 'grotato');
                                subscription.unsubscribe();
                                done();
                            }
                        }
                    }
                    catch (err) {
                        subscription.unsubscribe();
                        done(err);
                    }
                },
                complete: function () { },
                error: function (err) {
                    throw err;
                }
            });
            return coldMemstore._set(coldMemstore.keyString(invalidated), { id: invalidated.id, attributes: { name: 'slowtato' }, relationships: {} });
        })
            .then(function () {
            return terminalStore._set(terminalStore.keyString(invalidated), { id: invalidated.id, attributes: { name: 'grotato' }, relationships: {} });
        })
            .then(function () {
            return otherPlump.invalidate(invalidated, ['attributes']);
        })
            .catch(function (err) { return done(err); });
    });
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUNULE1BQU0sR0FBRyxDQUFDO2dCQUNaLENBQUM7YUFDRixDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDdEIsWUFBWSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFDbkMsRUFBRSxFQUFFLEVBQUUsV0FBVyxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxDQUM1RSxDQUFDO1FBQ0osQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDO1lBQ0osTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQ3ZCLGFBQWEsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQ3BDLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxFQUFFLEVBQUUsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FDM0UsQ0FBQztRQUNKLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQztZQUNKLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLFVBQUMsR0FBRyxJQUFLLE9BQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFULENBQVMsQ0FBQyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoicGx1bXAuc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgbm9kZSwgbW9jaGEqL1xuXG5cbmltcG9ydCAnbW9jaGEnO1xuaW1wb3J0ICogYXMgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCAqIGFzIGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuXG5pbXBvcnQgeyBQbHVtcCwgTWVtb3J5U3RvcmUgfSBmcm9tICcuLi9zcmMvaW5kZXgnO1xuaW1wb3J0IHsgVGVzdFR5cGUgfSBmcm9tICcuL3Rlc3RUeXBlJztcblxuQmx1ZWJpcmQuY29uZmlnKHtcbiAgbG9uZ1N0YWNrVHJhY2VzOiB0cnVlLFxufSk7XG5cbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcbmNvbnN0IGV4cGVjdCA9IGNoYWkuZXhwZWN0O1xuXG5kZXNjcmliZSgnUGx1bXAnLCAoKSA9PiB7XG4gIGl0KCdzaG91bGQgcHJvcGVybHkgdXNlIGhvdCBhbmQgY29sZCBjYWNoZXMnLCAoZG9uZSkgPT4ge1xuICAgIGNvbnN0IERlbGF5UHJveHkgPSB7XG4gICAgICBnZXQ6ICh0YXJnZXQsIG5hbWUpID0+IHtcbiAgICAgICAgaWYgKFsncmVhZCcsICd3cml0ZScsICdhZGQnLCAncmVtb3ZlJ10uaW5kZXhPZihuYW1lKSA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZGVsYXkoMjAwKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGFyZ2V0W25hbWVdKC4uLmFyZ3MpKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCB0ZXJtaW5hbFN0b3JlID0gbmV3IE1lbW9yeVN0b3JlKHsgdGVybWluYWw6IHRydWUgfSk7XG4gICAgY29uc3QgZGVsYXllZE1lbXN0b3JlID0gbmV3IFByb3h5KHRlcm1pbmFsU3RvcmUsIERlbGF5UHJveHkpO1xuICAgIGNvbnN0IGNvbGRNZW1zdG9yZSA9IG5ldyBNZW1vcnlTdG9yZSgpO1xuICAgIGNvbnN0IGhvdE1lbXN0b3JlID0gbmV3IE1lbW9yeVN0b3JlKCk7XG4gICAgaG90TWVtc3RvcmUuaG90ID0gKCkgPT4gdHJ1ZTtcbiAgICBjb25zdCBvdGhlclBsdW1wID0gbmV3IFBsdW1wKHtcbiAgICAgIHN0b3JhZ2U6IFtob3RNZW1zdG9yZSwgY29sZE1lbXN0b3JlLCBkZWxheWVkTWVtc3RvcmVdLFxuICAgICAgdHlwZXM6IFtUZXN0VHlwZV0sXG4gICAgfSk7XG4gICAgY29uc3QgaW52YWxpZGF0ZWQgPSBuZXcgVGVzdFR5cGUoeyBuYW1lOiAnZm9vJyB9LCBvdGhlclBsdW1wKTtcbiAgICBpbnZhbGlkYXRlZC5zYXZlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBsZXQgcGhhc2UgPSAwO1xuICAgICAgY29uc3QgbmV3T25lID0gb3RoZXJQbHVtcC5maW5kKCd0ZXN0cycsIGludmFsaWRhdGVkLmlkKTtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ld09uZS5zdWJzY3JpYmUoe1xuICAgICAgICBuZXh0OiAodikgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKHYuYXR0cmlidXRlcy5uYW1lKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ2F0dHJpYnV0ZXMnKS53aXRoLnByb3BlcnR5KCduYW1lJywgJ2ZvbycpO1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBoYXNlID09PSAxKSB7XG4gICAgICAgICAgICAgIGlmICh2LmF0dHJpYnV0ZXMubmFtZSA9PT0gJ3Nsb3d0YXRvJykge1xuICAgICAgICAgICAgICAgIHBoYXNlID0gMjtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh2LmF0dHJpYnV0ZXMubmFtZSA9PT0gJ2dyb3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgICAgaWYgKHYuYXR0cmlidXRlcy5uYW1lICE9PSAnc2xvd3RhdG8nKSB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KHYpLnRvLmhhdmUucHJvcGVydHkoJ2F0dHJpYnV0ZXMnKS53aXRoLnByb3BlcnR5KCduYW1lJywgJ2dyb3RhdG8nKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgZG9uZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29tcGxldGU6ICgpID0+IHsgLyogbm9vcCAqLyB9LFxuICAgICAgICBlcnJvcjogKGVycikgPT4ge1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gY29sZE1lbXN0b3JlLl9zZXQoXG4gICAgICAgIGNvbGRNZW1zdG9yZS5rZXlTdHJpbmcoaW52YWxpZGF0ZWQpLFxuICAgICAgICB7IGlkOiBpbnZhbGlkYXRlZC5pZCwgYXR0cmlidXRlczogeyBuYW1lOiAnc2xvd3RhdG8nIH0sIHJlbGF0aW9uc2hpcHM6IHt9IH1cbiAgICAgICk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICByZXR1cm4gdGVybWluYWxTdG9yZS5fc2V0KFxuICAgICAgICB0ZXJtaW5hbFN0b3JlLmtleVN0cmluZyhpbnZhbGlkYXRlZCksXG4gICAgICAgIHsgaWQ6IGludmFsaWRhdGVkLmlkLCBhdHRyaWJ1dGVzOiB7IG5hbWU6ICdncm90YXRvJyB9LCByZWxhdGlvbnNoaXBzOiB7fSB9XG4gICAgICApO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIG90aGVyUGx1bXAuaW52YWxpZGF0ZShpbnZhbGlkYXRlZCwgWydhdHRyaWJ1dGVzJ10pO1xuICAgIH0pXG4gICAgLmNhdGNoKChlcnIpID0+IGRvbmUoZXJyKSk7XG4gIH0pO1xufSk7XG4iXX0=
