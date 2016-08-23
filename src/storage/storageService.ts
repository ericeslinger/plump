import * as Promise from 'bluebird';
import {Dictionary, Storable} from './storable';

export interface StorageService {
  read(t: string, id: number): Promise<Storable>;
  create(t: string, v: Dictionary): Promise<Storable>;
  update(t: string, id: number, v: Storable): Promise<Storable>;
  delete(t: string, id: number): Promise<Storable>;
  query(q: {type: string, query: any}): Promise<[Storable]>;
  name: string;
}
