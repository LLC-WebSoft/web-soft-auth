const { test, expect } = require('@jest/globals');
const { database } = require('./prepare');

test('DatabaseQuery_ThrowDatabaseError_PoolQueryThrowError', async () => {
  await expect(database.query('errorSql')).rejects.toThrow(new Error('Data error.'));
});

test('DatabaseQuery_ThrowConflictError_PoolQueryThrowConflictError', async () => {
  await expect(database.query('conflictErrorSql')).rejects.toThrow(new Error('Conflict error.'));
});

test('DatabaseParseOperatorAndValue_ReturnLikeTemplateExpression_ValueHas*Or?', () => {
  expect(database.parseOperatorAndValue('some*template?inquery')).toEqual(['LIKE', 'some%template_inquery']);
});

test('DatabaseParseOperatorAndValue_ParseLessOperator_OperatorIsLess', () => {
  expect(database.parseOperatorAndValue('<value')).toEqual(['<', 'value']);
});

test('DatabaseParseOperatorAndValue_ParseLessOrEqualOperator_OperatorIsLessOrEqual', () => {
  expect(database.parseOperatorAndValue('<=value')).toEqual(['<=', 'value']);
});

test('DatabaseParseOperatorAndValue_ParseGreaterOperator_OperatorIsGreater', () => {
  expect(database.parseOperatorAndValue('>value')).toEqual(['>', 'value']);
});

test('DatabaseParseOperatorAndValue_ParseGreaterOrEqualOperator_OperatorIsGreaterOrEqual', () => {
  expect(database.parseOperatorAndValue('>=value')).toEqual(['>=', 'value']);
});

test('DatabaseParseOperatorAndValue_ParseNotEqualOperator_OperatorIsNotEqual', () => {
  expect(database.parseOperatorAndValue('<>value')).toEqual(['<>', 'value']);
});

test('DatabaseParseOperatorAndValue_ParseEqualOperator_NoOperatorInValue', () => {
  expect(database.parseOperatorAndValue('value')).toEqual(['=', 'value']);
});

test('DatabaseParseClauseAndArgs_ReturnEmptyArrays_NoPairsPassed', () => {
  expect(database.parseClauseAndArgs()).toEqual([[], []]);
});

test('DatabaseParseClauseAndArgs_StartArgsWithOne_NoStartArgPassed', () => {
  const pairs = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  const result = [
    ['"prop1" = $1', '"prop2" = $2', '"prop3" = $3'],
    ['val1', 'val2', 'val3']
  ];
  expect(database.parseClauseAndArgs(pairs)).toEqual(result);
});

test('DatabaseParseClauseAndArgs_StartArgsPassedParam_StartArgPassed', () => {
  const pairs = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  const result = [
    ['"prop1" = $3', '"prop2" = $4', '"prop3" = $5'],
    ['val1', 'val2', 'val3']
  ];
  expect(database.parseClauseAndArgs(pairs, 3)).toEqual(result);
});

test('DatabaseWhere_ReturnEmptyClause_NoConditionsPassed', () => {
  expect(database.where({})).toEqual(['', []]);
});

test('DatabaseWhere_ReturnWhereClause_ConditionsPassed', () => {
  const conditions = { prop1: 'val1', prop2: 23, prop3: 'val3' };
  const result = ['WHERE "prop1" = $1 AND "prop2" = $2 AND "prop3" = $3', ['val1', 23, 'val3']];
  expect(database.where(conditions)).toEqual(result);
});

test('DatabaseUpdates_ReturnEmptyClause_NoDeltaPassed', () => {
  expect(database.updates({})).toEqual(['', []]);
});

test('DatabaseUpdates_ReturnUpdateClause_DeltaPassed', () => {
  const delta = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  const result = ['SET "prop1" = $1, "prop2" = $2, "prop3" = $3', ['val1', 'val2', 'val3']];
  expect(database.updates(delta)).toEqual(result);
});

test('DatabaseInserts_ReturnEmptyValues_NoDataPassed', () => {
  const data = {};
  expect(database.inserts(data)).toEqual(['', '', []]);
});

test('DatabaseInserts_ReturnKeysNumbersValues_DataPassed', () => {
  const data = { prop1: 'val1', prop2: 'val2', prop3: 'val3' };
  expect(database.inserts(data)).toEqual(['"prop1", "prop2", "prop3"', '$1, $2, $3', ['val1', 'val2', 'val3']]);
});

test('DatabaseOrder_ReturnEmptyClause_NoFieldsPassed', () => {
  expect(database.order()).toEqual('');
});

test('DatabaseOrder_ReturnOrderClause_FieldsPassed', () => {
  const fields = ['field1', 'field2', 'field3'];
  expect(database.order(fields)).toEqual('ORDER BY "field1", "field2", "field3"');
});

test('DatabaseGetPageClause_ReturnEmptyClause_NoItemsOnPagePassed', () => {
  expect(database.getPageClause()).toEqual('');
});

test('DatabaseGetPageClause_ReturnEmptyClause_ItemsOnPageNotANumber', () => {
  expect(database.getPageClause('test')).toEqual('');
});

test('DatabaseGetPageClause_ReturnPageClauseWithOffsetZero_ItemsOnPagePassedPageNotPassed', () => {
  expect(database.getPageClause(30)).toEqual('LIMIT 30 OFFSET 0');
});

test('DatabaseGetPageClause_ReturnPageClauseWithProperOffset_ItemsOnPagePassedPagePassed', () => {
  expect(database.getPageClause(30, 2)).toEqual('LIMIT 30 OFFSET 30');
});

test('DatabaseReturning_ReturnEmptyClause_NoFieldsPassed', () => {
  expect(database.returning()).toEqual('');
});

test('DatabaseReturning_ReturnReturnClause_FieldsPassed', () => {
  const fields = ['field1', 'field2', 'field3'];
  expect(database.returning(fields)).toEqual('RETURNING "field1", "field2", "field3"');
});

test('DatabaseReturning_ReturnReturnClauseWith*_FirstFieldIs*', () => {
  const fields = ['*'];
  expect(database.returning(fields)).toEqual('RETURNING *');
});

test('DatabaseDelete_PassToQueryCorrectSql_AllArgsPassed', async () => {
  await database.delete('TestTable', { id: 40, username: 'admin' }, ['field1']);
  expect(database.pool.query.mock.calls[0][0]).toEqual(
    'DELETE FROM "TestTable" WHERE "id" = $1 AND "username" = $2 RETURNING "field1"'
  );
  expect(database.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});

test('DatabaseUpdate_PassToQueryCorrectSql_AllArgsPassed', async () => {
  await database.update('TestTable', { field3: 50, field2: 'text' }, { id: 40, username: 'admin' }, ['field1']);
  expect(database.pool.query.mock.calls[0][0]).toEqual(
    'UPDATE "TestTable" SET "field3" = $1, "field2" = $2 WHERE "id" = $3 AND "username" = $4 RETURNING "field1"'
  );
  expect(database.pool.query.mock.calls[0][1]).toEqual([50, 'text', 40, 'admin']);
});

test('DatabaseSelect_PassToQueryCorrectSql_AllArgsPassed', async () => {
  await database.select('TestTable', ['field1', 'field2'], { id: 40, username: 'admin' }, ['field1'], 30, 2);
  expect(database.pool.query.mock.calls[0][0]).toEqual(
    'SELECT "field1", "field2" FROM "TestTable" WHERE "id" = $1 AND "username" = $2 ORDER BY "field1" LIMIT 30 OFFSET 30'
  );
  expect(database.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});

test('DatabaseSelect_PassToQueryCorrectSqlWith*_NoFieldsPassed', async () => {
  await database.select('TestTable', [], { id: 40, username: 'admin' }, ['field1'], 30, 2);
  expect(database.pool.query.mock.calls[0][0]).toEqual(
    'SELECT * FROM "TestTable" WHERE "id" = $1 AND "username" = $2 ORDER BY "field1" LIMIT 30 OFFSET 30'
  );
  expect(database.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});

test('DatabaseInsert_PassToQueryCorrectSql_AllArgsPassed', async () => {
  await database.insert('TestTable', { id: 40, username: 'admin' }, ['field1']);
  expect(database.pool.query.mock.calls[0][0]).toEqual(
    'INSERT INTO "TestTable" ("id", "username") VALUES ($1, $2) RETURNING "field1"'
  );
  expect(database.pool.query.mock.calls[0][1]).toEqual([40, 'admin']);
});
