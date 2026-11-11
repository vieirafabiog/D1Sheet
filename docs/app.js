// Bilingual Translations (EN / PT)
const I18N = {
  en: {
    nav_why: 'Why D1Sheet',
    nav_sim: 'Live Simulator',
    nav_deploy: '5-Min Deploy',
    nav_connect: 'Integrations',
    hero_badge: 'OData v4 • Cloudflare Workers + D1',
    hero_title_1: 'Turn Cloudflare D1 into an ',
    hero_title_2: 'instant OData API.',
    hero_desc:
      'Bridge Google AppSheet, Power BI, Excel, and enterprise tools directly to Cloudflare D1 SQLite databases—with zero servers, sub-10ms edge latency, and full read/write CRUD.',
    hero_cta_deploy: 'Deploy in 5 Minutes',
    hero_cta_sim: 'Try Query Simulator',
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
    sim_tag: 'Interactive Sandbox',
    sim_title: 'OData → SQLite Translator Simulator',
    sim_desc:
      'Select a preset or tweak query parameters to inspect how D1Sheet compiles OData requests into parameterized SQLite queries.',
    pipe_tag: 'Under The Hood',
    pipe_title: 'Every Request in 4 Edge Steps',
    pipe_1_t: 'Timing-Safe Auth',
    pipe_1_d: 'Validates Basic Auth headers via SHA-256 constant-time XOR comparison.',
    pipe_2_t: 'AST Query Parser',
    pipe_2_d: 'Tokenizes $filter, $select, and $orderby into a strict syntax tree.',
    pipe_3_t: 'Parameterized SQL',
    pipe_3_d: 'Compiles queries using bound ? parameters—immune to SQL injection.',
    pipe_4_t: 'D1 + OData Envelope',
    pipe_4_d: 'Executes on D1 SQLite and returns OData v4 JSON with @odata.nextLink.',
    deploy_tag: 'Zero to Production',
    deploy_title: 'Deploy in 5 Minutes',
    deploy_desc: 'Six terminal commands to launch your serverless OData gateway on Cloudflare.',
    dep_1_t: '1. Clone & Install',
    dep_1_d: 'Download the repository and install Worker dependencies.',
    dep_2_t: '2. Create D1 Database',
    dep_2_d: 'Provision your serverless SQLite instance and paste the database_id into wrangler.toml.',
    dep_3_t: '3. Initialize Tables',
    dep_3_d: 'Push the sample Customers, Products, and Orders schema to your remote D1.',
    dep_4_t: '4. Set Secret & Deploy',
    dep_4_d: 'Store your Basic Auth password as an encrypted Cloudflare Secret and publish.',
    int_tag: 'Plug & Play Clients',
    int_title: 'Connect Anywhere via OData v4',
    int_desc: 'Built for Google AppSheet, compatible with every OData v4 consumer.',
    footer_note: 'Built with TypeScript, Hono & Cloudflare Workers. MIT License.',
  },
  pt: {
    nav_why: 'Por que D1Sheet',
    nav_sim: 'Simulador',
    nav_deploy: 'Deploy em 5 Min',
    nav_connect: 'Integrações',
    hero_badge: 'OData v4 • Cloudflare Workers + D1',
    hero_title_1: 'Transforme o Cloudflare D1 em uma ',
    hero_title_2: 'API OData instantânea.',
    hero_desc:
      'Conecte Google AppSheet, Power BI, Excel e sistemas corporativos direto ao Cloudflare D1 — sem servidores, com latência na borda e CRUD completo.',
    hero_cta_deploy: 'Fazer Deploy em 5 Min',
    hero_cta_sim: 'Testar Simulador',
    stat_1_val: '5M / dia',
    stat_1_lbl: 'Leituras Grátis no D1',
    stat_2_val: '0 Servidores',
    stat_2_lbl: 'Sem IPs ou Firewalls',
    stat_3_val: 'CRUD Completo',
    stat_3_lbl: 'GET, POST, PATCH, DELETE',
    why_tag: 'O Elo Perdido',
    why_title: 'O que o D1Sheet resolve?',
    why_desc:
      'O melhor banco SQL serverless na borda conectado às principais ferramentas No-Code e BI sem pagar por servidores ociosos.',
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
    stat_sql_3: 'Gargalos de latência em região única',
    card_sql_3: 'Gargalos de latência em região única',
    card_d1_title: 'D1Sheet + Cloudflare D1',
    card_d1_desc:
      'SQLite serverless na rede global da Cloudflare falando OData v4 fluente para AppSheet, Power BI e Excel.',
    card_d1_1: 'Cota gratuita enorme (5M leituras / dia)',
    card_d1_2: 'Endpoint HTTPS imediato, zero firewalls',
    card_d1_3: 'SQL 100% parametrizado e $metadata dinâmico',
    sim_tag: 'Sandbox Interativo',
    sim_title: 'Simulador OData → SQLite D1',
    sim_desc:
      'Escolha um cenário ou edite a URL para ver como o D1Sheet traduz consultas OData em SQL SQLite parametrizado e seguro.',
    pipe_tag: 'Por Dentro do Motor',
    pipe_title: 'Cada Requisição em 4 Passos',
    pipe_1_t: 'Auth em Tempo Constante',
    pipe_1_d: 'Valida Basic Auth usando hash SHA-256 + XOR contra timing attacks.',
    pipe_2_t: 'Parser AST OData',
    pipe_2_d: 'Tokeniza $filter, $select e $orderby em uma árvore sintática estrita.',
    pipe_3_t: 'SQL Parametrizado',
    pipe_3_d: 'Compila queries com marcadores ? seguros — imune a SQL Injection.',
    pipe_4_t: 'D1 + Envelope OData',
    pipe_4_d: 'Executa no D1 e retorna JSON OData v4 com @odata.nextLink.',
    deploy_tag: 'Do Zero à Produção',
    deploy_title: 'Deploy em 5 Minutos',
    deploy_desc: 'Seis comandos simples no terminal para colocar seu gateway OData no ar.',
    dep_1_t: '1. Clonar e Instalar',
    dep_1_d: 'Baixe o repositório e instale as dependências do Worker.',
    dep_2_t: '2. Criar Banco D1',
    dep_2_d: 'Crie seu banco serverless e cole o database_id no wrangler.toml.',
    dep_3_t: '3. Criar Tabelas',
    dep_3_d: 'Execute o schema inicial de exemplo (Customers, Products, Orders) no D1 remoto.',
    dep_4_t: '4. Senha Secreta & Deploy',
    dep_4_d: 'Salve a senha como Secret criptografada na Cloudflare e publique.',
    int_tag: 'Clientes Plug & Play',
    int_title: 'Conecte em Qualquer Ferramenta OData',
    int_desc: 'Criado pensando no Google AppSheet, compatível com todo o ecossistema OData v4.',
    footer_note: 'Construído com TypeScript, Hono e Cloudflare Workers. Licença MIT.',
  },
};

let currentLang = 'en';

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

function renderPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  const badge = document.getElementById('simMethod');
  badge.textContent = preset.method;
  badge.className = `method-badge ${preset.method}`;

  document.getElementById('simUrl').value = preset.url;
  document.getElementById('simSql').textContent = preset.sql;
  document.getElementById('simResponse').textContent = preset.response;

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === key);
  });
}

// Live URL Parser fallback when user edits the URL input manually
function handleCustomUrlInput(val) {
  try {
    const clean = val.trim();
    if (!clean.startsWith('/odata/')) return;
    const [pathPart, queryPart] = clean.split('?');
    const table = pathPart.replace('/odata/', '').split('(')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'Table';
    const params = new URLSearchParams(queryPart || '');

    const cols = params.get('$select')
      ? params.get('$select').split(',').map((c) => `"${c.trim()}"`).join(', ')
      : '*';
    const limit = Number(params.get('$top') || 100);
    const offset = Number(params.get('$skip') || 0);
    const filter = params.get('$filter');
    const order = params.get('$orderby');

    let sql = `SELECT ${cols} FROM "${table}"`;
    const bound = [];
    if (filter) {
      sql += `\nWHERE (${filter.replace(/eq/g, '=').replace(/gt/g, '>').replace(/lt/g, '<')})`;
    }
    if (order) {
      sql += `\nORDER BY ${order.toUpperCase()}`;
    }
    sql += `\nLIMIT ? OFFSET ?\n\n-- Bound Params\n[ ..., ${limit}, ${offset} ]`;
    document.getElementById('simSql').textContent = sql;
  } catch {
    // ignore partial typing
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Language Switcher
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => renderPreset(btn.dataset.preset));
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
      const codeEl = btn.parentElement.querySelector('code');
      if (!codeEl) return;
      try {
        await navigator.clipboard.writeText(codeEl.textContent.trim());
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

  renderPreset('filter');
});
