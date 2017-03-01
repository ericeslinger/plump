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
    return () => true;
  }

  if (Array.isArray(blockFilter[0])) {
    return blockFilter.map(createFilter).reduce((prev, curr) => { // eslint-disable-line
      return (elem) => prev(elem) && curr(elem);
    }, () => true);
  } else {
    const properties = blockFilter[0].split('.');
    const comparatorString = blockFilter[1];
    const expected = blockFilter[2];
    const comparator = getComparator(comparatorString);

    return (elem) => {
      const actual = properties.reduce((level, key) => level ? level[key] : undefined, elem);
      return comparator(actual, expected);
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
