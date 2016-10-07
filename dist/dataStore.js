'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Datastore = undefined;

var _model = require('./model');

const $types = Symbol('$types');
const $storage = Symbol('$storage');

class Datastore {
  constructor(opts = {}) {
    this[$storage] = opts.storage.concat();
    this[$types] = {};
    this.Base = _model.Model;
    this.Base.$storage = this[$storage];
  }
  defineType(type) {
    if (this[$types][type.$name] !== undefined) {
      throw new Error(`Duplicate type definition ${ type.$name }`);
    }
    this[$types][type.$name] = type;
  }
  getType(type) {
    return this[$types][type];
  }
  getStorage() {
    return this[$storage];
  }
  find(type, id) {
    const Type = this[$types][type];
    return new Type({
      [Type.$id]: id
    });
  }
}
exports.Datastore = Datastore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRhdGFTdG9yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBRUEsTUFBTSxTQUFTLE9BQU8sUUFBUCxDQUFmO0FBQ0EsTUFBTSxXQUFXLE9BQU8sVUFBUCxDQUFqQjs7QUFFTyxNQUFNLFNBQU4sQ0FBZ0I7QUFDckIsY0FBWSxPQUFPLEVBQW5CLEVBQXVCO0FBQ3JCLFNBQUssUUFBTCxJQUFpQixLQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQWpCO0FBQ0EsU0FBSyxNQUFMLElBQWUsRUFBZjtBQUNBLFNBQUssSUFBTDtBQUNBLFNBQUssSUFBTCxDQUFVLFFBQVYsR0FBcUIsS0FBSyxRQUFMLENBQXJCO0FBQ0Q7QUFDRCxhQUFXLElBQVgsRUFBaUI7QUFDZixRQUFJLEtBQUssTUFBTCxFQUFhLEtBQUssS0FBbEIsTUFBNkIsU0FBakMsRUFBNEM7QUFDMUMsWUFBTSxJQUFJLEtBQUosQ0FBVyw4QkFBNEIsS0FBSyxLQUFNLEdBQWxELENBQU47QUFDRDtBQUNELFNBQUssTUFBTCxFQUFhLEtBQUssS0FBbEIsSUFBMkIsSUFBM0I7QUFDRDtBQUNELFVBQVEsSUFBUixFQUFjO0FBQ1osV0FBTyxLQUFLLE1BQUwsRUFBYSxJQUFiLENBQVA7QUFDRDtBQUNELGVBQWE7QUFDWCxXQUFPLEtBQUssUUFBTCxDQUFQO0FBQ0Q7QUFDRCxPQUFLLElBQUwsRUFBVyxFQUFYLEVBQWU7QUFDYixVQUFNLE9BQU8sS0FBSyxNQUFMLEVBQWEsSUFBYixDQUFiO0FBQ0EsV0FBTyxJQUFJLElBQUosQ0FBUztBQUNkLE9BQUMsS0FBSyxHQUFOLEdBQVk7QUFERSxLQUFULENBQVA7QUFHRDtBQXhCb0I7UUFBVixTLEdBQUEsUyIsImZpbGUiOiJkYXRhU3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01vZGVsfSBmcm9tICcuL21vZGVsJztcblxuY29uc3QgJHR5cGVzID0gU3ltYm9sKCckdHlwZXMnKTtcbmNvbnN0ICRzdG9yYWdlID0gU3ltYm9sKCckc3RvcmFnZScpO1xuXG5leHBvcnQgY2xhc3MgRGF0YXN0b3JlIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgdGhpc1skc3RvcmFnZV0gPSBvcHRzLnN0b3JhZ2UuY29uY2F0KCk7XG4gICAgdGhpc1skdHlwZXNdID0ge307XG4gICAgdGhpcy5CYXNlID0gTW9kZWw7XG4gICAgdGhpcy5CYXNlLiRzdG9yYWdlID0gdGhpc1skc3RvcmFnZV07XG4gIH1cbiAgZGVmaW5lVHlwZSh0eXBlKSB7XG4gICAgaWYgKHRoaXNbJHR5cGVzXVt0eXBlLiRuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYER1cGxpY2F0ZSB0eXBlIGRlZmluaXRpb24gJHt0eXBlLiRuYW1lfWApO1xuICAgIH1cbiAgICB0aGlzWyR0eXBlc11bdHlwZS4kbmFtZV0gPSB0eXBlO1xuICB9XG4gIGdldFR5cGUodHlwZSkge1xuICAgIHJldHVybiB0aGlzWyR0eXBlc11bdHlwZV07XG4gIH1cbiAgZ2V0U3RvcmFnZSgpIHtcbiAgICByZXR1cm4gdGhpc1skc3RvcmFnZV07XG4gIH1cbiAgZmluZCh0eXBlLCBpZCkge1xuICAgIGNvbnN0IFR5cGUgPSB0aGlzWyR0eXBlc11bdHlwZV07XG4gICAgcmV0dXJuIG5ldyBUeXBlKHtcbiAgICAgIFtUeXBlLiRpZF06IGlkLFxuICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
