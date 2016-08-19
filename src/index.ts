import {hasMany} from './mixins/hasMany';
// import {dataModel} from './mixins/common';

// @dataModel
export class TestAnnotated {
  @hasMany({
    modelTable: 'other_guys',
  })
  public otherGuys: string;
  constructor(o) {
    this.otherGuys = o;
  }
}

export function go() {
  const ta = new TestAnnotated('foobar');
  console.log(JSON.stringify(ta));
}
