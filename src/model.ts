export class Model {
  private $storage: {
    [key: string]: any;
  };
  constructor() {
    this.$storage = {};
  }
}

/*
  annotate attribute to denote model info. use get/set to store.
  expose get/set on lifecycle hooks, also use updated etc.

  POSSIBLY make this unsettable - only do on update({attr: val})

  HANDLE push / pull sql and http
  HANDLE cache mem, redis, localforage
*/
