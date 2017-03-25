
      return Bluebird.reject(new Error('Plump has no terminal store'));
    }
  }

  invalidate(item: ModelReference, field?: string | string[]): void {
    const fields = Array.isArray(field) ? field : [field];
    this.terminal.fireWriteUpdate({ typeName: item.typeName, id: item.id , invalidate: fields });
  }
}

  constructor() {
  addType(T: typeof Model): Bluebird<void> {
  addStore(store: Storage): Bluebird<void> {
      return Bluebird.reject(new Error('Plump has no terminal store'));
    }
  }

  invalidate(item: ModelReference, field?: string | string[]): void {
    const fields = Array.isArray(field) ? field : [field];
    this.terminal.fireWriteUpdate({ typeName: item.typeName, id: item.id , invalidate: fields });
  }
}
