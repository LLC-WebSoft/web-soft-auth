const { Pool, types } = require('pg');
const pool = new Pool();

const UNIQUE_ERROR_CODE_PREFIX = '23';

//Do not parse dates.
types.setTypeParser(1082, (value) => value);

class Database {
  constructor() {
    this.operators = ['>=', '<=', '<>', '>', '<'];
    this.pool = new Pool();
  }

  async query(text, params) {
    try {
      const result = await pool.query(text, params);
      return result.rows;
    } catch (error) {
      if (error.code.startsWith(UNIQUE_ERROR_CODE_PREFIX)) {
        throw new Error(error.message);
      }
      throw new Error(error.message);
    }
  }

  async insert(table, data = {}, returning = []) {
    const [keys, numbers, values] = this.inserts(data);
    const returnClause = this.returning(returning);
    const sql = `INSERT INTO ${table} ("${keys}") VALUES (${numbers}) ${returnClause}`;
    const result = await this.query(sql, values);
    return result[0];
  }

  async select(table, fields = [], conditions = {}, orderFields = [], itemsOnPage, page) {
    const keys = fields.length ? `"${fields.join('", "')}"` : '*';
    const orderClause = this.order(orderFields);
    const [whereClause, whereArgs] = this.where(conditions);
    const pageClause = this.getPageClause(itemsOnPage, page);
    const sql = `SELECT ${keys} FROM ${table} ${whereClause} ${orderClause} ${pageClause}`;
    const result = await this.query(sql, whereArgs);
    return result;
  }

  async update(table, delta = {}, conditions = {}, returning = []) {
    const [updateClause, updateArgs] = this.updates(delta);
    const [whereClause, whereArgs] = this.where(conditions, updateArgs.length + 1);
    const returnClause = this.returning(returning);
    const sql = `UPDATE ${table} ${updateClause} ${whereClause} ${returnClause}`;
    const result = await this.query(sql, [...updateArgs, ...whereArgs]);
    return result;
  }

  async delete(table, conditions = {}, returning = []) {
    const [whereClause, whereArgs] = this.where(conditions);
    const returnClause = this.returning(returning);
    const sql = `DELETE FROM ${table} ${whereClause} ${returnClause}`;
    const result = await this.query(sql, whereArgs);
    return result;
  }

  returning(returning = []) {
    if (returning[0] === '*') {
      return 'RETURNING *';
    } else {
      return `RETURNING "${returning.join('", "')}"`;
    }
  }

  getPageClause(itemsOnPage, page = 1) {
    if (itemsOnPage && !isNaN(itemsOnPage)) {
      return `LIMIT ${itemsOnPage} OFFSET ${(page - 1) * itemsOnPage}`;
    }
    return '';
  }

  order(fields = []) {
    if (fields.length) {
      return `ORDER BY "${fields.join('", "')}"`;
    }
    return '';
  }

  inserts(data) {
    const numbers = [];
    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      numbers.push(`$${i}`);
    }
    return [keys.join('", "'), numbers.join(', '), Object.values(data)];
  }

  updates(delta, startArgNumber = 1) {
    const [clause, args] = this.parseClauseAndArgs(delta, startArgNumber);
    if (args.length) {
      return [`SET ${clause.join(', ')}`, args];
    }
    return ['', args];
  }

  where(conditions, startArgNumber = 1) {
    const [clause, args] = this.parseClauseAndArgs(conditions, startArgNumber);
    if (args.length) {
      return [`WHERE ${clause.join(' AND ')}`, args];
    }
    return ['', args];
  }

  parseClauseAndArgs(pairs, startArg = 1) {
    const clause = [];
    const args = [];
    let i = startArg;
    for (const key in pairs) {
      const [operator, value] = this.parseOperatorAndValue(`${pairs[key]}`);
      clause.push(`"${key}" ${operator} $${i++}`);
      args.push(value);
    }
    return [clause, args];
  }

  parseOperatorAndValue(value) {
    if (value.includes('*') || value.includes('?')) {
      return ['LIKE', value.replace(/\*/g, '%').replace(/\?/g, '_')];
    }
    for (const operator of this.operators) {
      if (value.startsWith(operator)) {
        return [operator, value.substring(operator.length)];
      }
    }
    return ['=', value];
  }
}

module.exports = { Database };
