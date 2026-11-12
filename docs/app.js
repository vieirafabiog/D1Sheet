// Bilingual Translations (EN / PT)
const I18N = {
  en: {
    nav_why: 'Why D1Sheet',
    nav_sim: 'Simulator',
    nav_config: 'Config',
    nav_deploy: 'Deploy',
    nav_api: 'API Reference',
    nav_connect: 'Integrations',

    hero_badge: 'D1 · OData v4 Gateway',
    hero_title: 'The easiest way to expose D1 via OData',
    hero_desc:
      'Bridge Google AppSheet, Power BI, Excel, and enterprise tools directly to Cloudflare D1 SQLite databases—with zero servers, sub-10ms edge latency, and full read/write CRUD.',
    hero_cta_deploy: 'Deploy in 5 Minutes',
    hero_cta_sim: 'View Simulator',
    stat_1_val: '5M / day',
    stat_1_lbl: 'Free D1 Reads',
    stat_2_val: '0 Servers',
    stat_2_lbl: 'No IPs or Firewalls',
    stat_3_val: 'Full CRUD',
    stat_3_lbl: 'GET, POST, PATCH, DELETE',

    why_tag: 'The Architecture Gap',
    why_title: 'Why build D1Sheet?',
    why_desc:
      'Modern edge SQL meets universal enterprise connectivity without managing servers or paying for idle cloud instances.',
    card_sheets_title: 'Spreadsheets',
    card_sheets_desc:
      'Great for prototyping, but Google Sheets slows down past a few thousand rows and lacks real relational constraints.',
    card_sheets_1: 'Slow syncs on large tables',
    card_sheets_2: 'No foreign keys or ACID transactions',
    card_sheets_3: 'API rate limits under concurrent users',
    card_sql_title: 'Traditional SQL Servers',
    card_sql_desc:
      'PostgreSQL or SQL Server require always-on VMs, connection pools, static IPs, and firewall rules opened to external clouds.',
    card_sql_1: 'Monthly fixed server costs even when idle',
    card_sql_2: 'Complex VPC, SSL & IP allowlist setup',
    card_sql_3: 'Single-region latency spikes',
    card_d1_title: 'D1Sheet + Cloudflare D1',
    card_d1_desc:
      'Serverless SQLite replicated globally on Cloudflare Edge, speaking fluent OData v4 for AppSheet, Power BI, and Excel.',
    card_d1_1: 'Generous free tier (5M reads / 100k writes)',
    card_d1_2: 'Instant HTTP/HTTPS endpoint, zero firewalls',
    card_d1_3: '100% parameterized SQL & dynamic $metadata',

    pipe_tag: 'Under The Hood',
    pipe_title: 'Built for Edge-Native OData',
    pipe_1_t: 'Timing-Safe Authentication',
    pipe_1_d:
      'Validates HTTP Basic Auth headers via SHA-256 constant-time XOR comparison, preventing credential length and timing side-channel leaks.',
    pipe_2_t: 'AST Query Parser',
    pipe_2_d:
      'Tokenizes $filter, $select, and $orderby into a strict Abstract Syntax Tree, validating table and column names against safe alphanumeric rules.',
    pipe_3_t: 'Parameterized SQL Compiler',
    pipe_3_d:
      'Compiles every literal value into bound ? SQLite parameters—100% immune to SQL injection attacks.',
    pipe_4_t: 'D1 Execution & OData Envelope',
    pipe_4_d:
      'Executes directly on Cloudflare D1 via Worker bindings and formats standard OData v4 JSON with @odata.context and @odata.nextLink.',

    sim_tag: 'From query to SQLite',
    sim_title: 'OData to SQLite Translator',
    sim_desc:
      'Select a preset or edit the OData query path to inspect how D1Sheet compiles requests into parameterized D1 queries.',
    sim_view_both: 'combined.log',
    sim_view_sql: 'query.sql',
    sim_view_res: 'response.json',

    pre_filter_t: 'Filter & Sort',
    pre_filter_s: 'Translate $filter, $orderby, and $top into bound SQLite queries.',
    pre_select_t: 'Projection & contains()',
    pre_select_s: 'Restrict columns with $select and search substrings safely.',
    pre_meta_t: 'Dynamic $metadata',
    pre_meta_s: 'Reflect SQLite PRAGMA table_info into valid OData v4 EDMX XML.',
    pre_post_t: 'Insert Record (POST)',
    pre_post_s: 'Insert rows with native SQLite RETURNING * and 201 Created.',
    pre_patch_t: 'Update Entity (PATCH)',
    pre_patch_s: 'Support both Customers(1) and named keys like Customers(Id=1).',
    pre_del_t: 'Delete Entity (DELETE)',
    pre_del_s: 'Verify existence and remove records with 204 No Content.',

    cfg_tag: 'CONFIG',
    cfg_title: 'Configure wrangler.toml & Secrets',
    cfg_desc:
      'Everything is controlled cleanly through wrangler.toml bindings, [vars], and encrypted Cloudflare Secrets.',
    cfg_th_var: 'Variable / Binding',
    cfg_th_desc: 'Purpose',
    cfg_th_def: 'Default',
    cfg_db_desc: 'Cloudflare D1 database binding referenced in Worker code as env.DB',
    cfg_root_desc: 'Base URL route prefix for all OData endpoints',
    cfg_def_desc: 'Records per page when the client omits $top',
    cfg_max_desc: 'Hard ceiling for $top to safeguard Worker memory and D1 reads',
    cfg_user_desc: 'Username checked by the HTTP Basic Auth middleware',
    cfg_pass_desc:
      'Encrypted secret stored in Cloudflare (or .dev.vars locally)—never commit to Git.',
    cfg_sec_warn:
      'Security rule: Never put BASIC_AUTH_PASS in wrangler.toml. Always use npx wrangler secret put BASIC_AUTH_PASS for production and .dev.vars locally.',

    deploy_tag: 'Zero to Live in 5 Minutes',
    deploy_title: 'Step-by-Step Worker Deployment',
    deploy_desc:
      'Follow these six commands from a clean terminal to launch your production OData gateway on Cloudflare Edge.',
    prereq_node: 'Node.js 18+ installed',
    prereq_cf: 'Free Cloudflare Account',
    prereq_git: 'Git CLI',

    s1_t: 'Clone the Repository & Install Dependencies',
    s1_d: 'Pull the D1Sheet source from GitHub and install Hono, TypeScript, and Wrangler CLI.',
    s2_t: 'Authenticate & Create Your Cloudflare D1 Database',
    s2_d: 'Log into Cloudflare via Wrangler (once) and provision a new serverless SQLite database. Wrangler will print a [[d1_databases]] block with your unique database_id.',
    s3_t: 'Bind the Database in wrangler.toml',
    s3_d: 'Open wrangler.toml and paste the database_name and database_id generated in Step 2. Adjust BASIC_AUTH_USER or page size limits if desired.',
    s4_t: 'Create Tables & Seed Sample Data (Optional)',
    s4_d: 'Use the included schema.sql (Customers, Products, Orders) to populate your remote D1 right away, or run your own SQL migration file.',
    s5_t: 'Set Your Encrypted Production Password',
    s5_d: 'Store BASIC_AUTH_PASS inside Cloudflare encrypted Secrets. Wrangler will prompt you securely in the terminal.',
    s6_t: 'Deploy to Cloudflare Workers & Verify',
    s6_d: 'Publish your gateway globally in seconds. Wrangler outputs your live URL—test it immediately with cURL or Power BI.',

    api_tag: 'Protocol Specification',
    api_title: 'Endpoints & Query Options',
    api_desc:
      'Full OData v4 read/write capabilities paired with automatic SQLite schema reflection.',
    api_ep_th_method: 'Method',
    api_ep_th_path: 'Endpoint',
    api_ep_th_desc: 'Behavior',
    ep_1: 'OData Service Document listing all D1 tables for Power BI & AppSheet auto-discovery',
    ep_2: 'Dynamic EDMX XML schema inspected live via sqlite_master & PRAGMA table_info',
    ep_3: 'Query entity collection with $filter, $select, $orderby, $top, $skip, $count & @odata.nextLink',
    ep_4: 'Fetch single entity by primary key (supports Table(1), Table(Id=1), or Table/1)',
    ep_5: 'Return plain-text integer record count matching optional $filter',
    ep_6: 'Insert new row using SQLite RETURNING * and return 201 Created + Location header',
    ep_7: 'Partial or full update of existing row returning 200 OK + updated entity',
    ep_8: 'Delete record by primary key and return 204 No Content',

    api_q_th_param: 'OData Query Option',
    api_q_th_ex: 'Example',
    api_q_th_sql: 'SQLite Translation',
    q_rel: 'Relational comparisons',
    q_str: 'Substring match',
    q_pre: 'Prefix & suffix match',
    q_null: 'Null checks',
    q_case: 'Case folding & length',

    local_tag: 'Develop & Test Offline',
    local_title: 'Local Development Workflow',
    local_desc:
      'Run the full Worker + local SQLite D1 emulator and all 33 automated tests right on your machine.',
    local_1_t: '1. Configure .dev.vars',
    local_1_d: 'Create .dev.vars from the example file for your local Basic Auth password.',
    local_2_t: '2. Seed Local D1 SQLite',
    local_2_d: 'Initialize .wrangler/state/v3/d1 locally using schema.sql.',
    local_3_t: '3. Run Automated Tests (33/33)',
    local_3_d: 'Execute auth, SQL translator, CRUD, and metadata integration tests.',
    local_4_t: '4. Start Local Dev Server',
    local_4_d: 'Launch Wrangler local gateway at http://localhost:8787/odata.',

    int_tag: 'Plug & Play Clients',
    int_title: 'Connect Anywhere via OData v4',
    int_desc: 'Built for Google AppSheet, compatible with every OData v4 consumer.',
    appsheet_tip:
      'AppSheet Modeling Pro-Tips: Ensure every D1 table has an explicit Primary Key (e.g. Id INTEGER PRIMARY KEY AUTOINCREMENT or TEXT UUID) and avoid spaces in column names.',

    footer_note: 'Built with TypeScript, Hono & Cloudflare Workers. MIT License.',
  },
  pt: {
    nav_why: 'Por que D1Sheet',
    nav_sim: 'Simulador',
    nav_config: 'Configuração',
    nav_deploy: 'Deploy',
    nav_api: 'API & Queries',
    nav_connect: 'Integrações',

    hero_badge: 'D1 · Gateway OData v4',
    hero_title: 'O jeito mais simples de expor D1 via OData',
    hero_desc:
      'Conecte Google AppSheet, Power BI, Excel e sistemas corporativos direto ao Cloudflare D1 — sem servidores, com latência na borda e CRUD completo.',
    hero_cta_deploy: 'Deploy em 5 Minutos',
    hero_cta_sim: 'Ver Simulador',
    stat_1_val: '5M / dia',
    stat_1_lbl: 'Leituras Grátis no D1',
    stat_2_val: '0 Servidores',
    stat_2_lbl: 'Sem IPs ou Firewalls',
    stat_3_val: 'CRUD Completo',
    stat_3_lbl: 'GET, POST, PATCH, DELETE',

    why_tag: 'O Elo Perdido',
    why_title: 'Por que usar o D1Sheet?',
    why_desc:
      'SQL serverless na borda aliado à conectividade corporativa sem manter servidores ou pagar por instâncias ociosas.',
    card_sheets_title: 'Planilhas (Sheets)',
    card_sheets_desc:
      'Ótimas para protótipos, mas o Google Sheets fica lento após poucas milhares de linhas e não garante integridade relacional.',
    card_sheets_1: 'Sincronizações lentas em tabelas grandes',
    card_sheets_2: 'Sem chaves estrangeiras ou transações ACID',
    card_sheets_3: 'Limites de taxa com vários usuários simultâneos',
    card_sql_title: 'Bancos SQL Tradicionais',
    card_sql_desc:
      'PostgreSQL ou SQL Server exigem máquinas ligadas 24/7, gerenciamento de pools de conexão, IPs fixos e regras de firewall.',
    card_sql_1: 'Custo mensal fixo mesmo sem tráfego',
    card_sql_2: 'Configuração complexa de VPC, SSL e whitelist',
    card_sql_3: 'Gargalos de latência em região única',
    card_d1_title: 'D1Sheet + Cloudflare D1',
    card_d1_desc:
      'SQLite serverless na rede global da Cloudflare falando OData v4 fluente para AppSheet, Power BI e Excel.',
    card_d1_1: 'Cota gratuita enorme (5M leituras / dia)',
    card_d1_2: 'Endpoint HTTPS imediato, zero firewalls',
    card_d1_3: 'SQL 100% parametrizado e $metadata dinâmico',

    pipe_tag: 'Por Dentro do Motor',
    pipe_title: 'Construído para OData na Borda',
    pipe_1_t: 'Autenticação em Tempo Constante',
    pipe_1_d:
      'Valida cabeçalhos HTTP Basic Auth usando hash SHA-256 + comparação XOR em tempo constante contra timing attacks.',
    pipe_2_t: 'Parser AST de Consultas',
    pipe_2_d:
      'Tokeniza $filter, $select e $orderby em uma árvore sintática estrita, validando identificadores contra caracteres inseguros.',
    pipe_3_t: 'Compilador SQL Parametrizado',
    pipe_3_d:
      'Converte todos os literais em parâmetros ? do SQLite — 100% imune a SQL Injection.',
    pipe_4_t: 'Execução D1 & Envelope OData',
    pipe_4_d:
      'Executa direto no Cloudflare D1 via Worker binding e formata JSON OData v4 padrão com @odata.context e @odata.nextLink.',

    sim_tag: 'Da query ao SQLite',
    sim_title: 'Tradutor OData para SQLite',
    sim_desc:
      'Escolha um cenário ou edite a URL OData para inspecionar como o D1Sheet compila requisições em queries SQLite parametrizadas.',
    sim_view_both: 'combinado.log',
    sim_view_sql: 'query.sql',
    sim_view_res: 'resposta.json',

    pre_filter_t: 'Filtrar e Ordenar',
    pre_filter_s: 'Traduz $filter, $orderby e $top para SQLite parametrizado.',
    pre_select_t: 'Projeção & contains()',
    pre_select_s: 'Restringe colunas com $select e busca substrings com segurança.',
    pre_meta_t: '$metadata Dinâmico',
    pre_meta_s: 'Reflete PRAGMA table_info do SQLite em XML EDMX v4 válido.',
    pre_post_t: 'Inserir Registro (POST)',
    pre_post_s: 'Insere linhas usando RETURNING * nativo e status 201 Created.',
    pre_patch_t: 'Atualizar Entidade (PATCH)',
    pre_patch_s: 'Suporta tanto Customers(1) quanto chaves nomeadas Customers(Id=1).',
    pre_del_t: 'Remover Entidade (DELETE)',
    pre_del_s: 'Verifica existência e remove registros retornando 204 No Content.',

    cfg_tag: 'CONFIG',
    cfg_title: 'Configurando wrangler.toml e Secrets',
    cfg_desc:
      'Tudo é configurado de forma limpa pelos bindings do wrangler.toml, variáveis [vars] e Secrets criptografadas da Cloudflare.',
    cfg_th_var: 'Variável / Binding',
    cfg_th_desc: 'Finalidade',
    cfg_th_def: 'Padrão',
    cfg_db_desc: 'Binding do banco Cloudflare D1 acessado no Worker via env.DB',
    cfg_root_desc: 'Rota base de todos os endpoints OData',
    cfg_def_desc: 'Quantidade padrão de registros por página quando $top é omitido',
    cfg_max_desc: 'Limite máximo permitido para $top (proteção contra uso excessivo)',
    cfg_user_desc: 'Usuário esperado pela autenticação HTTP Basic Auth',
    cfg_pass_desc:
      'Senha armazenada como Secret criptografada na Cloudflare (ou .dev.vars local) — nunca suba no Git.',
    cfg_sec_warn:
      'Regra de Segurança: Nunca escreva BASIC_AUTH_PASS em texto claro no wrangler.toml. Use sempre npx wrangler secret put BASIC_AUTH_PASS em produção e .dev.vars localmente.',

    deploy_tag: 'Do Zero ao Ar em 5 Minutos',
    deploy_title: 'Passo a Passo Completo de Deploy',
    deploy_desc:
      'Siga estes 6 passos simples no terminal para colocar o seu gateway OData no ar na rede global da Cloudflare.',
    prereq_node: 'Node.js 18+ instalado',
    prereq_cf: 'Conta gratuita na Cloudflare',
    prereq_git: 'Git CLI',

    s1_t: 'Clonar o Repositório e Instalar Dependências',
    s1_d: 'Baixe o código oficial do D1Sheet no GitHub e instale Hono, TypeScript e Wrangler CLI.',
    s2_t: 'Autenticar e Criar seu Banco Cloudflare D1',
    s2_d: 'Faça login na Cloudflare via Wrangler (apenas 1 vez) e crie um novo banco SQLite serverless. O Wrangler imprimirá um bloco [[d1_databases]] com seu database_id único.',
    s3_t: 'Vincular o Banco no arquivo wrangler.toml',
    s3_d: 'Abra o wrangler.toml na raiz do projeto e cole o database_name e o database_id gerados no Passo 2. Se quiser, ajuste o BASIC_AUTH_USER ou o limite de paginação.',
    s4_t: 'Criar Tabelas e Dados de Exemplo (Opcional)',
    s4_d: 'Execute o schema.sql incluso (tabelas Customers, Products e Orders) no seu D1 remoto, ou rode o seu próprio arquivo .sql de criação de tabelas.',
    s5_t: 'Definir a Senha Criptografada de Produção',
    s5_d: 'Salve a variável BASIC_AUTH_PASS usando o gerenciador seguro de Secrets da Cloudflare. O terminal pedirá para digitar a senha de forma oculta.',
    s6_t: 'Publicar o Worker & Verificar',
    s6_d: 'Publique seu gateway globalmente em segundos. O Wrangler exibirá a sua URL live — teste imediatamente via cURL, Power BI ou AppSheet.',

    api_tag: 'Especificação do Protocolo',
    api_title: 'Endpoints & Opções de Query',
    api_desc:
      'Suporte completo a leitura e gravação OData v4 com introspecção dinâmica do esquema SQLite.',
    api_ep_th_method: 'Método',
    api_ep_th_path: 'Endpoint',
    api_ep_th_desc: 'Comportamento',
    ep_1: 'Documento de Serviço OData listando todas as tabelas para descoberta automática no Power BI e AppSheet',
    ep_2: 'Esquema XML EDMX dinâmico gerado ao vivo lendo sqlite_master e PRAGMA table_info',
    ep_3: 'Consulta coleções com $filter, $select, $orderby, $top, $skip, $count e paginação @odata.nextLink',
    ep_4: 'Busca registro único pela chave primária (aceita Table(1), Table(Id=1) ou Table/1)',
    ep_5: 'Retorna contagem pura em texto plano (text/plain) respeitando o $filter',
    ep_6: 'Insere nova linha usando RETURNING * do SQLite e retorna 201 Created + header Location',
    ep_7: 'Atualiza campos parciais ou completos e retorna 200 OK com o registro atualizado',
    ep_8: 'Remove o registro pela chave primária retornando 204 No Content',

    api_q_th_param: 'Parâmetro OData',
    api_q_th_ex: 'Exemplo',
    api_q_th_sql: 'Tradução SQLite',
    q_rel: 'Operadores relacionais',
    q_str: 'Contém substring',
    q_pre: 'Inicia com / Termina com',
    q_null: 'Verificação de nulos',
    q_case: 'Maiúsculas, minúsculas e tamanho',

    local_tag: 'Desenvolva & Teste Offline',
    local_title: 'Fluxo de Desenvolvimento Local',
    local_desc:
      'Rode o Worker inteiro com emulador local do banco D1 e os 33 testes automatizados direto na sua máquina.',
    local_1_t: '1. Configurar .dev.vars',
    local_1_d: 'Crie o arquivo .dev.vars a partir do exemplo para definir sua senha local.',
    local_2_t: '2. Popular D1 SQLite Local',
    local_2_d: 'Inicializa o banco SQLite em .wrangler/state/v3/d1 usando o schema.sql.',
    local_3_t: '3. Rodar Suíte de Testes (33/33)',
    local_3_d: 'Executa testes automatizados de Auth, Parser SQL, CRUD e $metadata.',
    local_4_t: '4. Iniciar Servidor Local',
    local_4_d: 'Sobe o gateway local do Wrangler em http://localhost:8787/odata.',

    int_tag: 'Clientes Plug & Play',
    int_title: 'Conecte em Qualquer Ferramenta OData',
    int_desc: 'Criado pensando no Google AppSheet, compatível com todo o ecossistema OData v4.',
    appsheet_tip:
      'Dica de Ouro para o AppSheet: Garanta que toda tabela no D1 tenha uma Chave Primária explícita (ex: Id INTEGER PRIMARY KEY AUTOINCREMENT ou TEXT UUID) e evite espaços nos nomes de colunas.',

    footer_note: 'Construído com TypeScript, Hono e Cloudflare Workers. Licença MIT.',
  },
};

let currentLang = 'en';
let currentPreset = 'filter';
let currentView = 'both';
let customSqlOverride = null;

// Simulator Presets
const PRESETS = {
  filter: {
    method: 'GET',
    url: '/odata/Customers?$filter=Balance gt 500 and IsVip eq true&$orderby=Balance desc&$top=2',
    sql: `-- Parameterized SQLite Query
SELECT * FROM "Customers"
WHERE (("Balance" > ?) AND ("IsVip" = ?))
ORDER BY "Balance" DESC
LIMIT ? OFFSET ?

-- Bound Parameters (Safe against SQL Injection)
[ 500, 1, 2, 0 ]`,
    response: `{
  "@odata.context": "https://d1sheet.workers.dev/odata/$metadata#Customers",
  "@odata.nextLink": "https://d1sheet.workers.dev/odata/Customers?$filter=Balance+gt+500+and+IsVip+eq+true&$orderby=Balance+desc&$skip=2&$top=2",
  "value": [
    {
      "Id": 3,
      "Name": "Charlie Brown",
      "Email": "charlie@peanuts.com",
      "IsVip": true,
      "Balance": 4890.5
    },
    {
      "Id": 1,
      "Name": "Alice Johnson",
      "Email": "alice@corp.com",
      "IsVip": true,
      "Balance": 1450.75
    }
  ]
}`,
  },
  select: {
    method: 'GET',
    url: "/odata/Customers?$select=Id,Name,City&$filter=contains(Email,'@corp.com')&$count=true",
    sql: `-- Data Query
SELECT "Id", "Name", "City" FROM "Customers"
WHERE (INSTR("Email", ?) > 0)
LIMIT ? OFFSET ?

-- Bound Parameters: [ "@corp.com", 100, 0 ]

-- Count Query
SELECT COUNT(*) AS count FROM "Customers"
WHERE (INSTR("Email", ?) > 0)`,
    response: `{
  "@odata.context": "https://d1sheet.workers.dev/odata/$metadata#Customers(Id,Name,City)",
  "@odata.count": 1,
  "value": [
    {
      "Id": 1,
      "Name": "Alice Johnson",
      "City": "New York"
    }
  ]
}`,
  },
  metadata: {
    method: 'GET',
    url: '/odata/$metadata',
    sql: `-- Schema Introspection Queries
SELECT name FROM sqlite_master
WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';

PRAGMA table_info("Customers");`,
    response: `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="D1Gateway" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Customers">
        <Key><PropertyRef Name="Id" /></Key>
        <Property Name="Id" Type="Edm.Int32" Nullable="false" />
        <Property Name="Name" Type="Edm.String" Nullable="false" />
        <Property Name="IsVip" Type="Edm.Boolean" Nullable="true" />
        <Property Name="Balance" Type="Edm.Double" Nullable="true" />
      </EntityType>
      <EntityContainer Name="DefaultContainer">
        <EntitySet Name="Customers" EntityType="D1Gateway.Customers" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`,
  },
  post: {
    method: 'POST',
    url: '/odata/Customers',
    sql: `-- Request Body
{ "Name": "Diana Prince", "Email": "diana@amazon.com", "IsVip": true, "Balance": 1250.0 }

-- Parameterized D1 Insert with Native RETURNING *
INSERT INTO "Customers" ("Name", "Email", "IsVip", "Balance")
VALUES (?, ?, ?, ?)
RETURNING *

-- Bound Parameters: [ "Diana Prince", "diana@amazon.com", 1, 1250.0 ]`,
    response: `HTTP/1.1 201 Created
Location: https://d1sheet.workers.dev/odata/Customers(6)
Preference-Applied: return=representation

{
  "@odata.context": "https://d1sheet.workers.dev/odata/$metadata#Customers/$entity",
  "Id": 6,
  "Name": "Diana Prince",
  "Email": "diana@amazon.com",
  "IsVip": true,
  "Balance": 1250.0
}`,
  },
  patch: {
    method: 'PATCH',
    url: '/odata/Customers(Id=1)',
    sql: `-- Request Body
{ "Balance": 2500.0, "IsVip": true }

-- Parameterized D1 Update
UPDATE "Customers"
SET "Balance" = ?, "IsVip" = ?
WHERE "Id" = ?
RETURNING *

-- Bound Parameters: [ 2500.0, 1, "1" ]`,
    response: `HTTP/1.1 200 OK

{
  "@odata.context": "https://d1sheet.workers.dev/odata/$metadata#Customers/$entity",
  "Id": 1,
  "Name": "Alice Johnson",
  "Email": "alice@corp.com",
  "IsVip": true,
  "Balance": 2500.0
}`,
  },
  delete: {
    method: 'DELETE',
    url: '/odata/Customers(4)',
    sql: `-- 1. Verify existence
SELECT * FROM "Customers" WHERE "Id" = ? LIMIT 1

-- 2. Parameterized Delete
DELETE FROM "Customers" WHERE "Id" = ?

-- Bound Parameters: [ "4" ]`,
    response: `HTTP/1.1 204 No Content
OData-Version: 4.0`,
  },
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderNumberedCode(text) {
  const container = document.getElementById('simCodeOutput');
  if (!container) return;

  const lines = text.split('\n');
  container.innerHTML = lines
    .map((line, index) => {
      const num = String(index + 1).padStart(2, '0');
      const safeLine = escapeHtml(line) || ' ';
      return `<div class="code-line"><span class="line-num">${num}</span><span class="line-text">${safeLine}</span></div>`;
    })
    .join('');
}

function renderSimulator() {
  const preset = PRESETS[currentPreset];
  if (!preset) return;

  const badge = document.getElementById('simMethod');
  badge.textContent = preset.method;
  badge.className = `method-badge ${preset.method}`;

  const sqlText = customSqlOverride !== null ? customSqlOverride : preset.sql;
  let outputText = '';

  if (currentView === 'sql') {
    outputText = sqlText;
  } else if (currentView === 'res') {
    outputText = preset.response;
  } else {
    outputText = `${sqlText}\n\n// --- OData v4 Response ---\n${preset.response}`;
  }

  renderNumberedCode(outputText);
}

function selectPreset(key) {
  currentPreset = key;
  customSqlOverride = null;
  const preset = PRESETS[key];
  if (preset) {
    document.getElementById('simUrl').value = preset.url;
  }

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === key);
  });

  renderSimulator();
}

function handleCustomUrlInput(val) {
  try {
    const clean = val.trim();
    if (!clean.startsWith('/odata/')) return;
    const [pathPart, queryPart] = clean.split('?');
    const table =
      pathPart.replace('/odata/', '').split('(')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'Table';
    const params = new URLSearchParams(queryPart || '');

    const cols = params.get('$select')
      ? params
          .get('$select')
          .split(',')
          .map((c) => `"${c.trim()}"`)
          .join(', ')
      : '*';
    const limit = Number(params.get('$top') || 100);
    const offset = Number(params.get('$skip') || 0);
    const filter = params.get('$filter');
    const order = params.get('$orderby');

    let sql = `-- Custom Live Query Translation\nSELECT ${cols} FROM "${table}"`;
    if (filter) {
      sql += `\nWHERE (${filter
        .replace(/\beq\b/gi, '=')
        .replace(/\bne\b/gi, '!=')
        .replace(/\bgt\b/gi, '>')
        .replace(/\bge\b/gi, '>=')
        .replace(/\blt\b/gi, '<')
        .replace(/\ble\b/gi, '<=')})`;
    }
    if (order) {
      sql += `\nORDER BY ${order.toUpperCase()}`;
    }
    sql += `\nLIMIT ? OFFSET ?\n\n-- Bound Parameters\n[ ..., ${limit}, ${offset} ]`;
    customSqlOverride = sql;
    renderSimulator();
  } catch {
    // ignore partial typing
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  const dict = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Language Switcher
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectPreset(btn.dataset.preset));
  });

  // View tabs in Simulator (combined / sql / response)
  document.querySelectorAll('.sim-tab-view').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      document.querySelectorAll('.sim-tab-view').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      renderSimulator();
    });
  });

  // Custom URL edit
  const simInput = document.getElementById('simUrl');
  if (simInput) {
    simInput.addEventListener('input', (e) => handleCustomUrlInput(e.target.value));
  }

  // Integration Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach((p) => {
        p.classList.toggle('active', p.id === `tab-${target}`);
      });
    });
  });

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.copyTarget;
      let textToCopy = '';

      if (targetId === 'simCodeOutput') {
        const lines = Array.from(document.querySelectorAll('#simCodeOutput .line-text'));
        textToCopy = lines.map((l) => l.textContent).join('\n');
      } else if (targetId) {
        const el = document.getElementById(targetId);
        if (el) textToCopy = el.textContent.trim();
      } else {
        const container = btn.closest('.code-block-wrap, .code-card, .bento-code-area');
        const codeEl = container ? container.querySelector('code, pre') : null;
        if (codeEl) textToCopy = codeEl.textContent.trim();
      }

      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const prev = btn.textContent;
        btn.textContent = currentLang === 'pt' ? 'Copiado!' : 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove('copied');
        }, 1600);
      } catch {
        // clipboard fallback
      }
    });
  });

  selectPreset('filter');
});
