

export default function unwrap(value) {
  const valueStore = {};
  Object.keys(value.constructor.$fields).forEach((fieldName) => {
    const field = value.constructor.$fields[fieldName];
    Object.defineProperty(valueStore, fieldName, {});
  });
}
