import test from 'node:test';
import assert from 'node:assert/strict';
import { ODataSqlTranslator } from '../src/odata/sqlTranslator';
import { ODataHttpError } from '../src/utils/odataError';

const translator = new ODataSqlTranslator({ defaultPageSize: 50, maxPageSize: 500 });

test('Basic translation with default pagination', () => {
  const result = translator.translate('Users', {});
  assert.equal(result.selectSql, 'SELECT * FROM "Users" LIMIT ? OFFSET ?');
  assert.deepEqual(result.params, [50, 0]);
  assert.equal(result.countSql, undefined);
});

test('$select clause translates and sanitizes columns', () => {
  const result = translator.translate('Customers', {
    $select: 'Id, Name, Email',
  });
  assert.equal(result.selectSql, 'SELECT "Id", "Name", "Email" FROM "Customers" LIMIT ? OFFSET ?');
  assert.deepEqual(result.selectedColumns, ['Id', 'Name', 'Email']);
});

test('$select rejects invalid/injected column names', () => {
  assert.throws(
    () => translator.translate('Customers', { $select: 'Id, Name; DROP TABLE Users;' }),
    (err: any) => err instanceof ODataHttpError && err.statusCode === 400
  );
});

test('$filter with comparison operators and literals', () => {
  const result = translator.translate('Products', {
    $filter: "Price gt 19.99 and (Quantity le 5 or IsFeatured eq true)",
  });
  assert.equal(
    result.selectSql,
    'SELECT * FROM "Products" WHERE (("Price" > ?) AND (("Quantity" <= ?) OR ("IsFeatured" = ?))) LIMIT ? OFFSET ?'
  );
  assert.deepEqual(result.params, [19.99, 5, 1, 50, 0]);
});

test('$filter handles escaped quotes and prevents SQL injection', () => {
  // 1. Escaped single quote inside OData string literal (O''Connor)
  const result = translator.translate('Authors', {
    $filter: "LastName eq 'O''Connor'",
  });
  assert.equal(
    result.selectSql,
    'SELECT * FROM "Authors" WHERE ("LastName" = ?) LIMIT ? OFFSET ?'
  );
  assert.equal(result.params[0], "O'Connor");

  // 2. SQL injection breakout attempt (unclosed / unescaped quote with SQL statements)
  assert.throws(
    () =>
      translator.translate('Authors', {
        $filter: "LastName eq 'Robert'; DROP TABLE Authors; --'",
      }),
    (err: any) => err instanceof ODataHttpError && err.statusCode === 400
  );
});

test('$filter handles null checks (eq null, ne null)', () => {
  const result = translator.translate('Tasks', {
    $filter: 'CompletedAt eq null and AssignedTo ne null',
  });
  assert.equal(
    result.selectSql,
    'SELECT * FROM "Tasks" WHERE (("CompletedAt" IS NULL) AND ("AssignedTo" IS NOT NULL)) LIMIT ? OFFSET ?'
  );
  assert.deepEqual(result.params, [50, 0]);
});

test('$filter handles contains, startswith, endswith string functions', () => {
  const result = translator.translate('Employees', {
    $filter: "contains(Email, '@corp.com') and startswith(BadgeNumber, 'EMP-') and endswith(FileExt, '.pdf')",
  });
  assert.equal(
    result.selectSql,
    'SELECT * FROM "Employees" WHERE (((INSTR("Email", ?) > 0) AND (INSTR("BadgeNumber", ?) = 1)) AND ("FileExt" LIKE (\'%\' || ?))) LIMIT ? OFFSET ?'
  );
  assert.deepEqual(result.params, ['@corp.com', 'EMP-', '.pdf', 50, 0]);
});

test('$filter handles tolower and toupper functions', () => {
  const result = translator.translate('Users', {
    $filter: "tolower(Username) eq 'admin'",
  });
  assert.equal(
    result.selectSql,
    'SELECT * FROM "Users" WHERE (LOWER("Username") = ?) LIMIT ? OFFSET ?'
  );
  assert.deepEqual(result.params, ['admin', 50, 0]);
});

test('$orderby translates columns and directions', () => {
  const result = translator.translate('Orders', {
    $orderby: 'CreatedAt desc, CustomerId asc, Amount',
  });
  assert.equal(
    result.selectSql,
    'SELECT * FROM "Orders" ORDER BY "CreatedAt" DESC, "CustomerId" ASC, "Amount" ASC LIMIT ? OFFSET ?'
  );
});

test('$top and $skip calculate limits, offsets and enforce maxPageSize', () => {
  const result1 = translator.translate('Items', {
    $top: '25',
    $skip: '100',
  });
  assert.equal(result1.limit, 25);
  assert.equal(result1.offset, 100);
  assert.equal(result1.hasCustomLimit, true);

  // Exceeds maxPageSize (500)
  const result2 = translator.translate('Items', {
    $top: '9999',
  });
  assert.equal(result2.limit, 500);
});

test('$count=true generates countSql with filter parameters', () => {
  const result = translator.translate('Orders', {
    $filter: "Status eq 'Shipped'",
    $count: 'true',
    $top: '10',
  });
  assert.equal(result.countSql, 'SELECT COUNT(*) AS count FROM "Orders" WHERE ("Status" = ?)');
  assert.deepEqual(result.countParams, ['Shipped']);
  assert.equal(result.selectSql, 'SELECT * FROM "Orders" WHERE ("Status" = ?) LIMIT ? OFFSET ?');
  assert.deepEqual(result.params, ['Shipped', 10, 0]);
});
