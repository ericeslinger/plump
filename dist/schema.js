"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Schema(s) {
    return function annotate(target) {
        target.typeName = s.name;
        target.schema = s;
        return target;
    };
}
exports.Schema = Schema;
;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxnQkFBdUIsQ0FBYztJQUNuQyxNQUFNLENBQUMsa0JBQWtCLE1BQVc7UUFDbEMsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQU5ELHdCQU1DO0FBQUEsQ0FBQyIsImZpbGUiOiJzY2hlbWEuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2RlbFNjaGVtYSB9IGZyb20gJy4vZGF0YVR5cGVzJztcbmV4cG9ydCBmdW5jdGlvbiBTY2hlbWEoczogTW9kZWxTY2hlbWEpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFubm90YXRlKHRhcmdldDogYW55KSB7XG4gICAgdGFyZ2V0LnR5cGVOYW1lID0gcy5uYW1lO1xuICAgIHRhcmdldC5zY2hlbWEgPSBzO1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH07XG59O1xuIl19
