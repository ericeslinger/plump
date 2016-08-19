export interface HasManyOptions {
  modelTable: string;
}

export function hasMany(options: HasManyOptions) {
  return (model: any, member: string) => {
    console.log('hasMany decorator called');
    console.log(model);
    console.log(member);
  }
}
