import { ODataHttpError } from '../utils/odataError';
import type {
  ASTNode,
  BinaryExpressionNode,
  FunctionCallNode,
  IdentifierNode,
  LiteralNode,
  Token,
} from './types';
import { ODataTokenizer } from './tokenizer';

export class ODataParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public static parse(expression: string): ASTNode {
    if (!expression || expression.trim().length === 0) {
      throw new ODataHttpError(400, 'InvalidQuery', '$filter expression cannot be empty.');
    }
    const tokenizer = new ODataTokenizer(expression);
    const tokens = tokenizer.tokenize();
    const parser = new ODataParser(tokens);
    const ast = parser.parseExpression();

    if (!parser.isAtEnd()) {
      const leftover = parser.peek();
      throw new ODataHttpError(
        400,
        'InvalidQuery',
        `Unexpected token '${leftover.value}' at position ${leftover.position} in $filter expression.`
      );
    }

    return ast;
  }

  private parseExpression(): ASTNode {
    return this.parseOr();
  }

  // Logical OR (lowest precedence among logical operators)
  private parseOr(): ASTNode {
    let expr = this.parseAnd();

    while (this.matchOperator('or')) {
      const right = this.parseAnd();
      expr = {
        type: 'BinaryExpression',
        operator: 'or',
        left: expr,
        right,
      } as BinaryExpressionNode;
    }

    return expr;
  }

  // Logical AND
  private parseAnd(): ASTNode {
    let expr = this.parseNot();

    while (this.matchOperator('and')) {
      const right = this.parseNot();
      expr = {
        type: 'BinaryExpression',
        operator: 'and',
        left: expr,
        right,
      } as BinaryExpressionNode;
    }

    return expr;
  }

  // Logical NOT
  private parseNot(): ASTNode {
    if (this.matchOperator('not')) {
      const argument = this.parseNot();
      return {
        type: 'UnaryExpression',
        operator: 'not',
        argument,
      };
    }

    return this.parseRelational();
  }

  // Relational comparisons: eq, ne, gt, ge, lt, le
  private parseRelational(): ASTNode {
    const left = this.parsePrimary();

    const currentToken = this.peek();
    if (
      currentToken.type === 'OPERATOR' &&
      ['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(currentToken.value)
    ) {
      const opToken = this.advance();
      const right = this.parsePrimary();
      return {
        type: 'BinaryExpression',
        operator: opToken.value as BinaryExpressionNode['operator'],
        left,
        right,
      };
    }

    return left;
  }

  // Primary expressions: Literals, Identifiers, Function Calls, Parentheses
  private parsePrimary(): ASTNode {
    const token = this.peek();

    // 1. Grouping: ( ... )
    if (token.type === 'LPAREN') {
      this.advance();
      const expr = this.parseExpression();
      this.consume('RPAREN', "Expected ')' after grouping expression.");
      return expr;
    }

    // 2. String literal
    if (token.type === 'STRING') {
      this.advance();
      return {
        type: 'Literal',
        value: token.value,
        raw: token.value,
      } as LiteralNode;
    }

    // 3. Number literal
    if (token.type === 'NUMBER') {
      this.advance();
      const num = Number(token.value);
      if (Number.isNaN(num)) {
        throw new ODataHttpError(
          400,
          'InvalidQuery',
          `Invalid numeric literal '${token.value}' at position ${token.position}.`
        );
      }
      return {
        type: 'Literal',
        value: num,
        raw: token.value,
      } as LiteralNode;
    }

    // 4. Boolean literal
    if (token.type === 'BOOLEAN') {
      this.advance();
      return {
        type: 'Literal',
        value: token.value === 'true',
        raw: token.value,
      } as LiteralNode;
    }

    // 5. Null literal
    if (token.type === 'NULL') {
      this.advance();
      return {
        type: 'Literal',
        value: null,
        raw: 'null',
      } as LiteralNode;
    }

    // 6. Identifier or Function call
    if (token.type === 'IDENTIFIER') {
      this.advance();
      // Check if followed by '(' -> function call
      if (this.check('LPAREN')) {
        return this.parseFunctionCall(token.value);
      }

      return {
        type: 'Identifier',
        name: token.value,
      } as IdentifierNode;
    }

    throw new ODataHttpError(
      400,
      'InvalidQuery',
      `Unexpected token '${token.value || 'EOF'}' at position ${token.position} in $filter expression.`
    );
  }

  private parseFunctionCall(name: string): FunctionCallNode {
    this.consume('LPAREN', `Expected '(' after function name '${name}'.`);
    const args: ASTNode[] = [];

    if (!this.check('RPAREN')) {
      do {
        args.push(this.parseExpression());
      } while (this.match('COMMA'));
    }

    this.consume('RPAREN', `Expected ')' after function arguments for '${name}'.`);

    return {
      type: 'FunctionCall',
      name: name.toLowerCase(),
      arguments: args,
    };
  }

  private matchOperator(op: string): boolean {
    if (this.check('OPERATOR') && this.peek().value === op) {
      this.advance();
      return true;
    }
    return false;
  }

  private match(type: Token['type']): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: Token['type']): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: Token['type'], message: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new ODataHttpError(400, 'InvalidQuery', `${message} Got '${token.value || 'EOF'}' at position ${token.position}.`);
  }
}
