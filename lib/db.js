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

  async select(table, fields = [], conditions = {}, orderFields = ['id'], page, itemsOnPage) {
    const keys = fields && fields.length ? `"${fields.join('", "')}"` : '*';
    const sql = `SELECT ${keys} FROM ${table}`;
    let whereClause = '';
    let args = [];
    if (conditions && Object.keys(conditions) !== 0) {
      const whereData = this.where(conditions);
      whereClause = ' WHERE ' + whereData.clause;
      args = whereData.args;
    }
    const orderClause = ` ORDER BY "${orderFields.join('", "')}"`;
    let limitClause = '';
    if (page && itemsOnPage) {
      limitClause = ` LIMIT ${itemsOnPage}
       OFFSET ${(page - 1) * itemsOnPage}`;
    }
    const result = await this.query(sql + whereClause + orderClause + limitClause, args);
    return result;
  }

  async update(table, delta = {}, conditions = {}, returning = []) {
    const [updateClause, updateArgs] = this.updates(delta);
    const [whereClause, whereArgs] = this.where(conditions, updateArgs.length + 1);
    const returnClause = this.returning(returning);
    const sql = `UPDATE ${table} SET ${updateClause} WHERE ${whereClause} ${returnClause}`;
    const result = await this.query(sql, [...updateArgs, ...whereArgs]);
    return result;
  }

  async delete(table, conditions = {}, returning = []) {
    const [whereClause, whereArgs] = this.where(conditions);
    const returnClause = this.returning(returning);
    const sql = `DELETE FROM ${table} WHERE ${whereClause} ${returnClause}`;
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
    return [clause.join(', '), args];
  }

  where(conditions, startArgNumber = 1) {
    const [clause, args] = this.parseClauseAndArgs(conditions, startArgNumber);
    return [clause.join(' AND '), args];
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
