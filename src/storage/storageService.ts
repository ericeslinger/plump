export interface StorageService {
  read(t: string, id: number): Promise<any>;
  create(t: string, v: any): Promise<any>;
  update(t: string, id: number, v: any): Promise<any>;
  delete(t: string, id: number): Promise<any>;
  query(q: string): Promise<[any]>;
  name: string;
}
