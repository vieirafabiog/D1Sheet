export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'NULL'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export type ASTNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | FunctionCallNode
  | IdentifierNode
  | LiteralNode;

export interface BinaryExpressionNode {
  type: 'BinaryExpression';
  operator: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'and' | 'or';
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpressionNode {
  type: 'UnaryExpression';
  operator: 'not';
  argument: ASTNode;
}

export interface FunctionCallNode {
  type: 'FunctionCall';
  name: string;
  arguments: ASTNode[];
}

export interface IdentifierNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

export interface ODataQueryParams {
  $filter?: string;
  $select?: string;
  $orderby?: string;
  $top?: string;
  $skip?: string;
  $count?: string;
  $inlinecount?: string;
}

export interface GeneratedSqlQuery {
  selectSql: string;
  countSql?: string;
  params: (string | number | boolean | null)[];
  countParams?: (string | number | boolean | null)[];
  limit: number;
  offset: number;
  hasCustomLimit: boolean;
  selectedColumns: string[];
}

