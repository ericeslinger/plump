function getComparator(comparatorString) {
  if (comparatorString === '=') {
    return (a, b) => a === b;
  } else if (comparatorString === '>') {
    return (a, b) => a > b;
  } else if (comparatorString === '>=') {
    return (a, b) => a >= b;
  } else if (comparatorString === '<') {
    return (a, b) => a < b;
  } else if (comparatorString === '<=') {
    return (a, b) => a <= b;
  } else if (comparatorString === '!=') {
    return (a, b) => a !== b;
  } else {
    return (a, b) => true; // eslint-disable-line
  }
}

function handleWhere(blockFilter) {
  if (!blockFilter[0]) {
    return function bad() {
      return false;
    };
  }

  if (Array.isArray(blockFilter[0])) {
    return blockFilter.map(createFilter).reduce((prev, curr) => { // eslint-disable-line
      return (elem) => prev(elem) && curr(elem);
    }, () => { return true; });
  } else {
    const prop = blockFilter[0];
    const comparatorString = blockFilter[1];
    const value = blockFilter[2];

    return (elem) => {
      const comparator = getComparator(comparatorString);
      return comparator(elem[prop], value);
    };
  }
}

export function createFilter(blockFilter) {
  if (blockFilter[0] && blockFilter[0] === 'where') {
    return handleWhere(blockFilter.slice(1));
  } else {
    return () => false;
  }
}
