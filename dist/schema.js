"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Schema(s) {
    return function annotate(target) {
        target.type = s.name;
        target.schema = s;
        return target;
    };
}
exports.Schema = Schema;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxnQkFBdUIsQ0FBYztJQUNuQyxNQUFNLENBQUMsa0JBQWtCLE1BQVc7UUFDbEMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQU5ELHdCQU1DIiwiZmlsZSI6InNjaGVtYS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZGVsU2NoZW1hIH0gZnJvbSAnLi9kYXRhVHlwZXMnO1xuZXhwb3J0IGZ1bmN0aW9uIFNjaGVtYShzOiBNb2RlbFNjaGVtYSkge1xuICByZXR1cm4gZnVuY3Rpb24gYW5ub3RhdGUodGFyZ2V0OiBhbnkpIHtcbiAgICB0YXJnZXQudHlwZSA9IHMubmFtZTtcbiAgICB0YXJnZXQuc2NoZW1hID0gcztcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9O1xufVxuIl19
