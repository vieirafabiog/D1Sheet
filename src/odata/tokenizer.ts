import { ODataHttpError } from '../utils/odataError';
import type { Token } from './types';

const OPERATORS = new Set(['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'and', 'or', 'not']);

export class ODataTokenizer {
  private input: string;
  private pos: number = 0;
  private len: number;

  constructor(input: string) {
    this.input = input;
    this.len = input.length;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.len) {
      const ch = this.input[this.pos];

      // 1. Skip whitespace
      if (/\s/.test(ch)) {
        this.pos++;
        continue;
      }

      const start = this.pos;

      // 2. Parentheses & Comma
      if (ch === '(') {
        this.pos++;
        tokens.push({ type: 'LPAREN', value: '(', position: start });
        continue;
      }
      if (ch === ')') {
        this.pos++;
        tokens.push({ type: 'RPAREN', value: ')', position: start });
        continue;
      }
      if (ch === ',') {
        this.pos++;
        tokens.push({ type: 'COMMA', value: ',', position: start });
        continue;
      }

      // 3. String literals (enclosed in single quotes, escaped with '')
      if (ch === "'") {
        tokens.push(this.readString(start));
        continue;
      }

      // 4. Numbers (e.g., 42, -15, 3.14)
      if (this.isDigitStart(ch)) {
        tokens.push(this.readNumber(start));
        continue;
      }

      // 5. Identifiers, keywords, operators, booleans, null
      if (this.isIdentifierStart(ch)) {
        tokens.push(this.readIdentifierOrKeyword(start));
        continue;
      }

      throw new ODataHttpError(
        400,
        'InvalidQuery',
        `Unexpected character '${ch}' at position ${start} in $filter expression.`
      );
    }

    tokens.push({ type: 'EOF', value: '', position: this.pos });
    return tokens;
  }

  private readString(start: number): Token {
    this.pos++; // skip initial quote
    let value = '';

    while (this.pos < this.len) {
      const ch = this.input[this.pos];
      if (ch === "'") {
        // Check for escaped quote ''
        if (this.pos + 1 < this.len && this.input[this.pos + 1] === "'") {
          value += "'";
          this.pos += 2;
        } else {
          // End of string
          this.pos++;
          return { type: 'STRING', value, position: start };
        }
      } else {
        value += ch;
        this.pos++;
      }
    }

    throw new ODataHttpError(
      400,
      'InvalidQuery',
      `Unterminated string literal starting at position ${start}.`
    );
  }

  private isDigitStart(ch: string): boolean {
    if (/\d/.test(ch)) return true;
    if (ch === '-' && this.pos + 1 < this.len && /\d/.test(this.input[this.pos + 1])) {
      return true;
    }
    return false;
  }

  private readNumber(start: number): Token {
    if (this.input[this.pos] === '-') {
      this.pos++;
    }

    while (this.pos < this.len && /\d/.test(this.input[this.pos])) {
      this.pos++;
    }

    if (this.pos < this.len && this.input[this.pos] === '.' && this.pos + 1 < this.len && /\d/.test(this.input[this.pos + 1])) {
      this.pos++; // consume '.'
      while (this.pos < this.len && /\d/.test(this.input[this.pos])) {
        this.pos++;
      }
    }

    const value = this.input.slice(start, this.pos);
    return { type: 'NUMBER', value, position: start };
  }

  private isIdentifierStart(ch: string): boolean {
    return /[a-zA-Z_]/.test(ch);
  }

  private isIdentifierPart(ch: string): boolean {
    return /[a-zA-Z0-9_/]/.test(ch);
  }

  private readIdentifierOrKeyword(start: number): Token {
    while (this.pos < this.len && this.isIdentifierPart(this.input[this.pos])) {
      this.pos++;
    }

    const raw = this.input.slice(start, this.pos);
    const lower = raw.toLowerCase();

    if (OPERATORS.has(lower)) {
      return { type: 'OPERATOR', value: lower, position: start };
    }
    if (lower === 'true' || lower === 'false') {
      return { type: 'BOOLEAN', value: lower, position: start };
    }
    if (lower === 'null') {
      return { type: 'NULL', value: 'null', position: start };
    }

    return { type: 'IDENTIFIER', value: raw, position: start };
  }
}
