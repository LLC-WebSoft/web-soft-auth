const { test, expect } = require('@jest/globals');
const { Pool } = require('pg');
const {Database} = require('../lib/db');

const UNIQUE_ERROR_CODE_PREFIX = '23';
jest.mock('pg');

beforeEach( () => {
  Pool.mockImplementation( () => {
    return {
      query: jest.fn( async (text, params) => {
        if (text === 'errorSql') {
          const error = new Error();
          error.code = '0';
          throw error;
        } else if ( text === 'conflictErrorSql' ) {
          const error = new Error();
          error.code = UNIQUE_ERROR_CODE_PREFIX;
          throw error;
        } else {
          return { rows: [] }
        }
      } ),
    };
  } );
} );

test('DatabaseQuery_ThrowDatabaseError_PoolQueryThrowError', async () => {
  const db = new Database();
  await expect(db.query('errorSql')).rejects.toThrow(new Error('Database error!'));
});

test('DatabaseQuery_ThrowConflictDatabaseError_PoolQueryThrowConflictError', async () => {
  const db = new Database();
  await expect(db.query('conflictErrorSql')).rejects.toThrow(new Error('Conflict database error!'));
});

test('DatabaseParseOperatorAndValue_ReturnLikeTemplateExpression_ValueHas*Or?', () => {
  const db = new Database();
  expect(db.parseOperatorAndValue('some*template?inquery')).toEqual(['LIKE', 'some%template_inquery']);
});

test('DatabaseParseOperatorAndValue_ParseAllOperators_OperatorNotEqual', () => {
  const db = new Database();
  const operators = ['>=', '<=', '<>', '>', '<'];
  const results = [];
  for (const operator of operators) {
    results.push(db.parseOperatorAndValue(`${operator}value`));
  }
  expect(results).toEqual([['>=', 'value'], ['<=', 'value'], ['<>', 'value'], ['>', 'value'], ['<', 'value']]);
});

test('DatabaseParseOperatorAndValue_ParseEqualOperator_NoOperatorInValue', () => {
  const db = new Database();
  expect(db.parseOperatorAndValue('value')).toEqual(['=', 'value']);
});

test('DatabaseParseClauseAndArgs_ReturnEmptyArrays_NoPairsPassed', () => {
  const db = new Database();
  expect(db.parseClauseAndArgs()).toEqual([[], []]);
});

test('DatabaseParseClauseAndArgs_StartArgsWithOne_NoStartArgPassed', () => {
  const db = new Database();
  const pairs = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  const result = [ ['"prop1" = $1', '"prop2" = $2', '"prop3" = $3'], ['val1', 'val2', 'val3'] ]
  expect(db.parseClauseAndArgs( pairs )).toEqual(result);
});

test('DatabaseParseClauseAndArgs_StartArgsPassedParam_StartArgPassed', () => {
  const db = new Database();
  const pairs = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  const result = [ ['"prop1" = $3', '"prop2" = $4', '"prop3" = $5'], ['val1', 'val2', 'val3'] ]
  expect(db.parseClauseAndArgs( pairs, 3 )).toEqual(result);
});

test('DatabaseWhere_ReturnEmptyClause_NoConditionsPassed', () => {
  const db = new Database();
  expect(db.where( {} )).toEqual(['', []]);
});

test('DatabaseWhere_ReturnWhereClause_ConditionsPassed', () => {
  const db = new Database();
  const conditions = { prop1: 'val1', prop2: 23, prop3: 'val3' };
  const result = [ 'WHERE "prop1" = $1 AND "prop2" = $2 AND "prop3" = $3', ['val1', 23, 'val3'] ]
  expect(db.where( conditions )).toEqual(result);
});

test('DatabaseUpdates_ReturnEmptyClause_NoDeltaPassed', () => {
  const db = new Database();
  expect(db.updates( {} )).toEqual(['', []]);
});

test('DatabaseUpdates_ReturnUpdateClause_DeltaPassed', () => {
  const db = new Database();
  const delta = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  const result = [ 'SET "prop1" = $1, "prop2" = $2, "prop3" = $3', ['val1', 'val2', 'val3'] ]
  expect(db.updates( delta )).toEqual(result);
});

test('DatabaseInserts_ReturnEmptyValues_NoDataPassed', () => {
  const db = new Database();
  const data = {};
  expect(db.inserts( data )).toEqual(['', '', []]);
});

test('DatabaseInserts_ReturnKeysNumbersValues_DataPassed', () => {
  const db = new Database();
  const data = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  expect(db.inserts( data )).toEqual(['"prop1", "prop2", "prop3"', '$1, $2, $3', ['val1', 'val2', 'val3']]);
});

test('DatabaseOrder_ReturnEmptyClause_NoFieldsPassed', () => {
  const db = new Database();
  expect(db.order()).toEqual('');
});

test('DatabaseOrder_ReturnOrderClause_FieldsPassed', () => {
  const db = new Database();
  const fields = ['field1', 'field2', 'field3'];
  expect(db.order( fields )).toEqual('ORDER BY "field1", "field2", "field3"');
});

test('DatabaseGetPageClause_ReturnEmptyClause_NoItemsOnPagePassed', () => {
  const db = new Database();
  expect(db.getPageClause()).toEqual('');
});

test('DatabaseGetPageClause_ReturnEmptyClause_ItemsOnPageNotANumber', () => {
  const db = new Database();
  expect(db.getPageClause('test')).toEqual('');
  expect(db.getPageClause(null)).toEqual('');
});

test('DatabaseGetPageClause_ReturnPageClauseWithOffsetZero_ItemsOnPagePassedPageNotPassed', () => {
  const db = new Database();
  expect(db.getPageClause(30)).toEqual('LIMIT 30 OFFSET 0');
});

test('DatabaseGetPageClause_ReturnPageClauseWithProperOffset_ItemsOnPagePassedPagePassed', () => {
  const db = new Database();
  expect(db.getPageClause(30, 2)).toEqual('LIMIT 30 OFFSET 30');
});

test('DatabaseReturning_ReturnEmptyClause_NoFieldsPassed', () => {
  const db = new Database();
  expect(db.returning()).toEqual('');
});

test('DatabaseReturning_ReturnReturnClause_FieldsPassed', () => {
  const db = new Database();
  const fields = ['field1', 'field2', 'field3'];
  expect(db.returning( fields )).toEqual('RETURNING "field1", "field2", "field3"');
});

test('DatabaseReturning_ReturnReturnClauseWith*_FirstFieldIs*', () => {
  const db = new Database();
  const fields = ['*'];
  expect(db.returning( fields )).toEqual('RETURNING *');
});

test('DatabaseDelete_PassToQueryCorrectSql_AllArgsPassed', async () => {
  const db = new Database();
  await db.delete( 'TestTable', { id: 40, username: 'admin' }, ['field1'] );
  expect(db.pool.query.mock.calls[0][0]).toEqual('DELETE FROM "TestTable" WHERE "id" = $1 AND "username" = $2 RETURNING "field1"');
  expect(db.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});

test('DatabaseUpdate_PassToQueryCorrectSql_AllArgsPassed', async () => {
  const db = new Database();
  await db.update( 'TestTable', {field3: 50, field2: 'text'}, { id: 40, username: 'admin' }, ['field1'] );
  expect(db.pool.query.mock.calls[0][0]).toEqual('UPDATE "TestTable" SET "field3" = $1, "field2" = $2 WHERE "id" = $3 AND "username" = $4 RETURNING "field1"');
  expect(db.pool.query.mock.calls[0][1]).toEqual([50,'text', 40, 'admin']);
});

test('DatabaseSelect_PassToQueryCorrectSql_AllArgsPassed', async () => {
  const db = new Database();
  await db.select( 'TestTable', ['field1', 'field2'], { id: 40, username: 'admin' }, ['field1'], 30, 2 );
  expect(db.pool.query.mock.calls[0][0]).toEqual('SELECT "field1", "field2" FROM "TestTable" WHERE "id" = $1 AND "username" = $2 ORDER BY "field1" LIMIT 30 OFFSET 30');
  expect(db.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});

test('DatabaseSelect_PassToQueryCorrectSqlWith*_NoFieldsPassed', async () => {
  const db = new Database();
  await db.select( 'TestTable', [], { id: 40, username: 'admin' }, ['field1'], 30, 2 );
  expect(db.pool.query.mock.calls[0][0]).toEqual('SELECT * FROM "TestTable" WHERE "id" = $1 AND "username" = $2 ORDER BY "field1" LIMIT 30 OFFSET 30');
  expect(db.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});

test('DatabaseInsert_PassToQueryCorrectSql_AllArgsPassed', async () => {
  const db = new Database();
  await db.insert( 'TestTable', { id: 40, username: 'admin' }, ['field1'] );
  expect(db.pool.query.mock.calls[0][0]).toEqual('INSERT INTO "TestTable" ("id", "username") VALUES ($1, $2) RETURNING "field1"');
  expect(db.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});
