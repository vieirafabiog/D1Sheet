import { ODataHttpError } from '../utils/odataError';
import { ODataParser } from './parser';
import type {
  ASTNode,
  BinaryExpressionNode,
  FunctionCallNode,
  GeneratedSqlQuery,
  LiteralNode,
  ODataQueryParams,
  UnaryExpressionNode,
} from './types';

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export interface SqlTranslatorOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
}

export class ODataSqlTranslator {
  private defaultPageSize: number;
  private maxPageSize: number;

  constructor(options?: SqlTranslatorOptions) {
    this.defaultPageSize = options?.defaultPageSize ?? 100;
    this.maxPageSize = options?.maxPageSize ?? 1000;
  }

  public translate(tableName: string, params: ODataQueryParams): GeneratedSqlQuery {
    this.validateIdentifier(tableName, 'table name');
    const safeTable = `"${tableName}"`;

    // 1. Columns ($select)
    const { selectClause, selectedColumns } = this.buildSelectClause(params.$select);

    // 2. Filter ($filter)
    const filterParams: (string | number | boolean | null)[] = [];
    const whereClause = this.buildWhereClause(params.$filter, filterParams);

    // 3. Order By ($orderby)
    const orderClause = this.buildOrderByClause(params.$orderby);

    // 4. Pagination ($top, $skip)
    const { limit, offset, hasCustomLimit } = this.calculatePagination(
      params.$top,
      params.$skip
    );

    // Base query parts
    let selectSql = `SELECT ${selectClause} FROM ${safeTable}`;
    if (whereClause) {
      selectSql += ` WHERE ${whereClause}`;
    }
    if (orderClause) {
      selectSql += ` ORDER BY ${orderClause}`;
    }

    const allParams = [...filterParams];
    selectSql += ` LIMIT ? OFFSET ?`;
    allParams.push(limit, offset);

    // Count query ($count=true or $inlinecount=allpages)
    let countSql: string | undefined;
    let countParams: (string | number | boolean | null)[] | undefined;

    const requestCount =
      params.$count === 'true' ||
      params.$inlinecount === 'allpages';

    if (requestCount) {
      countSql = `SELECT COUNT(*) AS count FROM ${safeTable}`;
      if (whereClause) {
        countSql += ` WHERE ${whereClause}`;
      }
      countParams = [...filterParams];
    }

    return {
      selectSql,
      countSql,
      params: allParams,
      countParams,
      limit,
      offset,
      hasCustomLimit,
      selectedColumns,
    };
  }

  private buildSelectClause(selectParam?: string): {
    selectClause: string;
    selectedColumns: string[];
  } {
    if (!selectParam || selectParam.trim() === '' || selectParam.trim() === '*') {
      return { selectClause: '*', selectedColumns: ['*'] };
    }

    const columns = selectParam.split(',').map((c) => c.trim()).filter(Boolean);
    if (columns.length === 0) {
      return { selectClause: '*', selectedColumns: ['*'] };
    }

    const safeCols: string[] = [];
    const selectedColumns: string[] = [];

    for (const col of columns) {
      this.validateIdentifier(col, 'column in $select');
      safeCols.push(`"${col}"`);
      selectedColumns.push(col);
    }

    return {
      selectClause: safeCols.join(', '),
      selectedColumns,
    };
  }

  private buildWhereClause(
    filterParam: string | undefined,
    params: (string | number | boolean | null)[]
  ): string | null {
    if (!filterParam || filterParam.trim().length === 0) {
      return null;
    }

    const ast = ODataParser.parse(filterParam);
    return this.translateNode(ast, params);
  }

  private translateNode(
    node: ASTNode,
    params: (string | number | boolean | null)[]
  ): string {
    switch (node.type) {
      case 'BinaryExpression':
        return this.translateBinary(node, params);
      case 'UnaryExpression':
        return this.translateUnary(node, params);
      case 'FunctionCall':
        return this.translateFunction(node, params);
      case 'Identifier':
        this.validateIdentifier(node.name, 'column name in $filter');
        return `"${node.name}"`;
      case 'Literal':
        return this.translateLiteral(node, params);
      default:
        throw new ODataHttpError(400, 'InvalidQuery', 'Unsupported AST node in filter.');
    }
  }

  private translateBinary(
    node: BinaryExpressionNode,
    params: (string | number | boolean | null)[]
  ): string {
    const { operator, left, right } = node;

    // Special handling for null comparisons: IS NULL / IS NOT NULL
    if (right.type === 'Literal' && right.value === null) {
      const leftSql = this.translateNode(left, params);
      if (operator === 'eq') return `(${leftSql} IS NULL)`;
      if (operator === 'ne') return `(${leftSql} IS NOT NULL)`;
      throw new ODataHttpError(
        400,
        'InvalidQuery',
        `Operator '${operator}' is not supported with null.`
      );
    }

    if (left.type === 'Literal' && left.value === null) {
      const rightSql = this.translateNode(right, params);
      if (operator === 'eq') return `(${rightSql} IS NULL)`;
      if (operator === 'ne') return `(${rightSql} IS NOT NULL)`;
      throw new ODataHttpError(
        400,
        'InvalidQuery',
        `Operator '${operator}' is not supported with null.`
      );
    }

    const leftSql = this.translateNode(left, params);
    const rightSql = this.translateNode(right, params);

    switch (operator) {
      case 'and':
        return `(${leftSql} AND ${rightSql})`;
      case 'or':
        return `(${leftSql} OR ${rightSql})`;
      case 'eq':
        return `(${leftSql} = ${rightSql})`;
      case 'ne':
        return `(${leftSql} != ${rightSql})`;
      case 'gt':
        return `(${leftSql} > ${rightSql})`;
      case 'ge':
        return `(${leftSql} >= ${rightSql})`;
      case 'lt':
        return `(${leftSql} < ${rightSql})`;
      case 'le':
        return `(${leftSql} <= ${rightSql})`;
      default:
        throw new ODataHttpError(400, 'InvalidQuery', `Unsupported operator: ${operator}`);
    }
  }

  private translateUnary(
    node: UnaryExpressionNode,
    params: (string | number | boolean | null)[]
  ): string {
    if (node.operator === 'not') {
      const argSql = this.translateNode(node.argument, params);
      return `(NOT ${argSql})`;
    }
    throw new ODataHttpError(400, 'InvalidQuery', `Unsupported unary operator: ${node.operator}`);
  }

  private translateFunction(
    node: FunctionCallNode,
    params: (string | number | boolean | null)[]
  ): string {
    const fnName = node.name.toLowerCase();

    switch (fnName) {
      case 'contains': {
        if (node.arguments.length !== 2) {
          throw new ODataHttpError(400, 'InvalidQuery', "Function 'contains' requires exactly 2 arguments.");
        }
        const target = this.translateNode(node.arguments[0], params);
        const search = this.translateNode(node.arguments[1], params);
        return `(INSTR(${target}, ${search}) > 0)`;
      }

      case 'startswith': {
        if (node.arguments.length !== 2) {
          throw new ODataHttpError(400, 'InvalidQuery', "Function 'startswith' requires exactly 2 arguments.");
        }
        const target = this.translateNode(node.arguments[0], params);
        const prefix = this.translateNode(node.arguments[1], params);
        return `(INSTR(${target}, ${prefix}) = 1)`;
      }

      case 'endswith': {
        if (node.arguments.length !== 2) {
          throw new ODataHttpError(400, 'InvalidQuery', "Function 'endswith' requires exactly 2 arguments.");
        }
        const target = this.translateNode(node.arguments[0], params);
        const suffix = this.translateNode(node.arguments[1], params);
        return `(${target} LIKE ('%' || ${suffix}))`;
      }

      case 'tolower': {
        if (node.arguments.length !== 1) {
          throw new ODataHttpError(400, 'InvalidQuery', "Function 'tolower' requires exactly 1 argument.");
        }
        const arg = this.translateNode(node.arguments[0], params);
        return `LOWER(${arg})`;
      }

      case 'toupper': {
        if (node.arguments.length !== 1) {
          throw new ODataHttpError(400, 'InvalidQuery', "Function 'toupper' requires exactly 1 argument.");
        }
        const arg = this.translateNode(node.arguments[0], params);
        return `UPPER(${arg})`;
      }

      case 'length': {
        if (node.arguments.length !== 1) {
          throw new ODataHttpError(400, 'InvalidQuery', "Function 'length' requires exactly 1 argument.");
        }
        const arg = this.translateNode(node.arguments[0], params);
        return `LENGTH(${arg})`;
      }

      default:
        throw new ODataHttpError(400, 'InvalidQuery', `Unsupported OData function: '${node.name}'`);
    }
  }

  private translateLiteral(
    node: LiteralNode,
    params: (string | number | boolean | null)[]
  ): string {
    if (typeof node.value === 'boolean') {
      // In SQLite, boolean values are represented as integers 1 and 0
      params.push(node.value ? 1 : 0);
    } else {
      params.push(node.value);
    }
    return '?';
  }

  private buildOrderByClause(orderByParam?: string): string | null {
    if (!orderByParam || orderByParam.trim().length === 0) {
      return null;
    }

    const parts = orderByParam.split(',').map((p) => p.trim()).filter(Boolean);
    const clauses: string[] = [];

    for (const part of parts) {
      const tokens = part.split(/\s+/);
      const col = tokens[0];
      this.validateIdentifier(col, 'column in $orderby');

      let dir = 'ASC';
      if (tokens.length > 1) {
        const d = tokens[1].toUpperCase();
        if (d === 'ASC' || d === 'DESC') {
          dir = d;
        } else {
          throw new ODataHttpError(
            400,
            'InvalidQuery',
            `Invalid direction '${tokens[1]}' in $orderby. Expected 'asc' or 'desc'.`
          );
        }
      }

      clauses.push(`"${col}" ${dir}`);
    }

    return clauses.length > 0 ? clauses.join(', ') : null;
  }

  private calculatePagination(
    topParam?: string,
    skipParam?: string
  ): { limit: number; offset: number; hasCustomLimit: boolean } {
    let limit = this.defaultPageSize;
    let hasCustomLimit = false;

    if (topParam !== undefined && topParam.trim() !== '') {
      const topNum = Number(topParam);
      if (!Number.isInteger(topNum) || topNum < 0) {
        throw new ODataHttpError(400, 'InvalidQuery', '$top must be a non-negative integer.');
      }
      limit = Math.min(topNum, this.maxPageSize);
      hasCustomLimit = true;
    }

    let offset = 0;
    if (skipParam !== undefined && skipParam.trim() !== '') {
      const skipNum = Number(skipParam);
      if (!Number.isInteger(skipNum) || skipNum < 0) {
        throw new ODataHttpError(400, 'InvalidQuery', '$skip must be a non-negative integer.');
      }
      offset = skipNum;
    }

    return { limit, offset, hasCustomLimit };
  }

  private validateIdentifier(name: string, context: string): void {
    if (!IDENTIFIER_REGEX.test(name)) {
      throw new ODataHttpError(
        400,
        'InvalidQuery',
        `Invalid ${context}: '${name}'. Identifiers must be alphanumeric or underscore.`
      );
    }
  }
}
