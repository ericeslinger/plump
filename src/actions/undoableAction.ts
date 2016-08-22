import * as Promise from 'bluebird';

interface UndoableAction {
  undo(): Promise<any>;
}
