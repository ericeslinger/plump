export interface HasManyOptions {
    modelTable: string;
}
export declare function hasMany(options: HasManyOptions): (model: any, member: string) => void;
