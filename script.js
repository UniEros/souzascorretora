const app = document.querySelector('#app');
const $ = s => document.querySelector(s);

const read = (k, d) => {
    try {
        return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
        return d;
    }
};

const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const money = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const products = [
    ['auto', 'Seguro Auto', 'Proteção completa para o seu carro', 189, '<img src="img/seguro_auto.jpeg" alt="Seguro Auto" style="width:52px;height:47px;object-fit:cover;border-radius:5px;">'],
    ['residencial', 'Seguro Residencial', 'Sua casa protegida todos os dias', 79, '<img src="img/seguro_residencia.jpeg" alt="Seguro Residencial" style="width:47px;height:47px;object-fit:cover;border-radius:5px;">'],
    ['vida', 'Seguro de Vida', 'Cuidado para você e sua família', 54, '<img src="img/seguro_vida.jpeg" alt="Seguro de Vida" style="width:54px;height:47px;object-fit:cover;border-radius:5px;">'],
    ['moto', 'Seguro Moto', 'Liberdade com tranquilidade', 92, '<img src="img/seguro_moto.jpeg" alt="Seguro Moto" style="width:47px;height:47px;object-fit:cover;border-radius:5px;">'],
    ['viagem', 'Seguro Viagem', 'Assistência onde você estiver', 38, '<img src="img/seguro_viagem.jpeg" alt="Seguro Viagem" style="width:47px;height:47px;object-fit:cover;border-radius:5px;">'],
    ['empresarial', 'Seguro Empresarial', 'Segurança para o seu negócio', 249, '<img src="img/seguro_empresarial.jpeg" alt="Seguro Empresarial" style="width:47px;height:47px;object-fit:cover;border-radius:5px;">']
];

const ordersDemo = [
    ['PED-2048', 'Mariana Costa', 'Seguro Auto', 'Hoje, 10:24', 2268, 'Novo'],
    ['PED-2047', 'Ricardo Alves', 'Seguro Residencial', 'Hoje, 09:10', 948, 'Em análise'],
    ['PED-2046', 'Camila Ferreira', 'Seguro de Vida', 'Ontem, 16:45', 1296, 'Documentação'],
    ['PED-2045', 'João Martins', 'Seguro Empresarial', 'Ontem, 14:20', 4880, 'Aprovado']
].map(([id, name, type, date, value, status]) => ({ id, name, type, date, value, status }));

const commentsDemo = [
    ['Ana Carolina', 'ana.carolina@email.com', '(19) 99918-2204', 'Gostaria de entender se o seguro residencial cobre danos elétricos em eletrodomésticos.'],
    ['Paulo Henrique', 'paulo.h@email.com', '(19) 98820-7741', 'Preciso atualizar o endereço cadastrado na minha apólice do veículo.'],
    ['Beatriz Souza', 'bia.souza@email.com', '(19) 99631-4820', 'Fui muito bem atendida pela equipe. Obrigada pela agilidade!']
].map(([name, email, phone, message]) => ({ name, email, phone, message, date: 'Hoje' }));

let S = {
    role: 'guest',
    page: 'overview',
    tab: 'login',
    selected: ['auto'],
    quotes: [],
    editingQuoteId: null,
    currentUser: null,
    orders: read('sz_orders', ordersDemo),
    policies: read('sz_policies', []),
    comments: read('sz_comments', commentsDemo),
    accounts: read('sz_accounts', []),
    order: null,
    filter: 'Todos os status'
};

const roles = {
    guest: 'Cliente não logado',
    client: 'Cliente logado',
    employee: 'Funcionário',
    admin: 'Administrador'
};

// Cada perfil possui sua própria coleção de orçamentos. Para clientes,
// a separação é por e-mail da conta; os demais perfis são separados por função.
function quoteStorageKey(role = S.role, user = S.currentUser) {
    if (role === 'client') {
        const email = String(user?.email || 'demo-client').trim().toLowerCase();
        return `sz_quotes_client_${encodeURIComponent(email)}`;
    }
    return `sz_quotes_${role}`;
}

function loadQuotes(role = S.role, user = S.currentUser) {
    const key = quoteStorageKey(role, user);
    const stored = localStorage.getItem(key);
    if (stored !== null) return read(key, []);

    // Migra os orçamentos antigos para a área pública, sem misturá-los
    // com os orçamentos de clientes autenticados, funcionários ou admins.
    if (role === 'guest') {
        const legacy = localStorage.getItem('sz_quotes');
        if (legacy !== null) {
            const oldQuotes = read('sz_quotes', []);
            save(key, oldQuotes);
            return oldQuotes;
        }
    }
    return [];
}

function persistQuotes() {
    save(quoteStorageKey(), S.quotes);
}

S.quotes = loadQuotes();

function toast(s) {
    let t = $('#toast');
    t.textContent = s;
    t.className = 'show';
    setTimeout(() => t.className = '', 3600);
}

function roleSelect() {
    return `<label style="font-size:11px;color:#777">Visualizar como <select id="role">${Object.entries(roles).map(([k, v]) => `<option value="${k}" ${S.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`;
}

const brand = () => `<a class="brand" href="#"><img src="img/souzas-logo.png" alt="Logo Souzas" style="width:42px;height:42px;object-fit:contain;"><span>Souzas<small>CORRETORA DE SEGUROS</small></span></a>`;

function quote() {
    let chosen = products.filter(p => S.selected.includes(p[0])),
        total = chosen.reduce((s, p) => s + p[3], 0);

    return `
        <div class="quote-layout" id="quote-builder">
            <div class="products">
                ${products.map(p => `
                    <button class="product ${S.selected.includes(p[0]) ? 'selected' : ''}" data-product="${p[0]}">
                        <div class="product-top">
                            <span class="ico">${p[4]}</span>
                            <div>
                                <b>${p[1]}</b>
                                <small>${p[2]}</small>
                            </div>
                        </div>
                        <div class="price">
                            <small>a partir de</small>
                            <b>${money(p[3]).replace(',00', '')}<small style="display:inline"> /mês</small></b>
                        </div>
                        <span class="circle">${S.selected.includes(p[0]) ? '✓' : '+'}</span>
                    </button>
                `).join('')}
            </div>
            <div class="panel summary">
                <span class="eyebrow">SEU ORÇAMENTO</span>
                <h3>Resumo da proteção <span style="float:right">${chosen.length}</span></h3>
                <div class="line">
                    ${chosen.map(p => `
                        <div class="summary-item">
                            <span>${p[4]} &nbsp; ${p[1]}</span>
                            <b>${money(p[3])}</b>
                        </div>
                    `).join('') || 'Selecione um seguro'}
                </div>
                <div class="total">
                    <small>Estimativa mensal</small>
                    <b>${money(total)}</b>
                </div>
                <button class="btn full" id="save-quote">${S.editingQuoteId ? 'Salvar alterações' : 'Salvar orçamento'} →</button>
                ${S.editingQuoteId ? '<button class="btn outline full" id="cancel-edit" style="margin-top:8px">Cancelar edição</button>' : ''}
                <p style="font-size:10px"><i class="fa-solid fa-circle-info"></i> Valores estimados. A proposta final depende da análise de perfil.</p>
            </div>
        </div>
        <div class="saved">
            <h3>Orçamentos salvos</h3>
            <div class="saved-grid">
                ${S.quotes.map(q => `
                    <div class="panel">
                        <span class="eyebrow">#${q.id}</span>
                        <h3>${q.items.map(id => products.find(p => p[0] === id)?.[1]).join(' + ')}</h3>
                        <p>Estimativa mensal: <b>${money(q.total)}</b></p>
                        <div class="actions">
                            <button class="btn" data-request="${q.id}">Pedir</button>
                            <button class="btn outline" data-edit="${q.id}">Editar</button>
                            <button class="btn danger" data-delete="${q.id}">Excluir</button>
                        </div>
                    </div>
                `).join('') || '<p>Nenhum orçamento salvo.</p>'}
            </div>
        </div>
    `;
}

function quotePage(isPublic = false) {
    return `
        <section ${isPublic ? 'class="section gray" id="orcamento"' : ''}>
            <div class="${isPublic ? 'wrap' : ''}">
                ${isPublic ? `
                    <div class="center">
                        <span class="eyebrow">MONTE SEU ORÇAMENTO</span>
                        <h2>Proteção do seu jeito</h2>
                        <p>Selecione os seguros que fazem sentido para você. É simples, rápido e sem compromisso.</p>
                    </div>
                ` : `
                    <span class="eyebrow">COTAÇÃO PERSONALIZADA</span>
                    <h2>Monte um novo orçamento</h2>
                    <p>Selecione as proteções para calcular a estimativa mensal.</p>
                `}
                ${quote()}
            </div>
        </section>
    `;
}

function contactForm() {
    return `
        <form id="contact" class="panel">
            <div class="form-grid">
                <label class="field">Nome<input name="name" required placeholder="Como podemos te chamar?"></label>
                <label class="field">E-mail<input name="email" type="email" required placeholder="seu@email.com"></label>
                <label class="field span2">Telefone<input name="phone" required placeholder="(19) 99999-9999"></label>
                <label class="field span2">Como podemos ajudar?<textarea name="message" required placeholder="Conte um pouco sobre o que você precisa..."></textarea></label>
            </div>
            <button class="btn">Enviar mensagem →</button>
        </form>
    `;
}

function authForm() {
    return `
        <div class="panel">
            <div class="tabs">
                <button data-tab="login" class="${S.tab === 'login' ? 'active' : ''}">Já sou cliente</button>
                <button data-tab="register" class="${S.tab === 'register' ? 'active' : ''}">Quero me cadastrar</button>
            </div>
            <h3>${S.tab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</h3>
            <p>${S.tab === 'login' ? 'Entre para acessar sua área.' : 'Leva menos de dois minutos.'}</p>
            <form id="${S.tab === 'login' ? 'login' : 'register'}">
                <div class="form-grid">
                    ${(S.tab === 'login' ? [['E-mail', 'email', 'email'], ['Senha', 'password', 'password']] : [['Nome completo', 'name', 'text'], ['Telefone', 'phone', 'tel'], ['CPF', 'cpf', 'text'], ['E-mail', 'email', 'email'], ['Profissão', 'profession', 'text'], ['Data de nascimento', 'birth', 'date'], ['Senha', 'password', 'password']]).map(([label, name, type]) => `
                        <label class="field ${S.tab === 'login' || name === 'name' ? 'span2' : ''}">
                            ${label}<input name="${name}" type="${type}" ${name === 'password' ? 'minlength="6"' : ''} required>
                        </label>
                    `).join('')}
                </div>
                <button class="btn full">${S.tab === 'login' ? 'Entrar na minha conta' : 'Criar minha conta'} →</button>
            </form>
        </div>
    `;
}

function publicPage() {
    return `
        <header class="header">
            <div class="wrap">
                ${brand()}
                <nav class="nav">
                    <a href="#inicio">Início</a>
                    <a href="#quem-somos">Quem somos</a>
                    <a href="#orcamento">Orçamento</a>
                    <a href="#contato">Contato</a>
                </nav>
                <div>
                    <a href="#acesso" style="margin-right:15px"><i class="fa-solid fa-user"></i> Entrar</a>
                    <a class="btn" href="#orcamento">Fazer orçamento</a>
                </div>
            </div>
        </header>
        <section class="hero" id="inicio">
            <div class="wrap hero-grid">
                <div>
                    <span class="eyebrow">— PROTEÇÃO QUE ACOMPANHA A SUA VIDA</span>
                    <h1>O que importa para você, <span>protegido por nós.</span></h1>
                    <p class="hero-description">Seguros feitos para a sua história, com atendimento próximo e as melhores coberturas do mercado.</p>
                    <div class="hero-actions">
                        <a href="#orcamento" class="btn">Encontre seu seguro →</a>
                        <a href="#quem-somos" class="hero-secondary">Conheça a Souzas →</a>
                    </div>
                    <div class="hero-benefits">
                        <span>✓ Cotação sem compromisso</span>
                        <span>✓ Atendimento humano</span>
                    </div>
                </div>
                <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1100" alt="Família sorrindo">
            </div>
        </section>
        <section class="section white" id="quem-somos">
            <div class="wrap about">
                <div class="stats">
                    <div class="stat">
                        <b>14</b>
                        <small>anos cuidando de histórias</small>
                    </div>
                    <div class="stat">
                        <b>98%</b>
                        <small>de clientes satisfeitos</small>
                    </div>
                    <div class="stat">
                        <b>24h</b>
                        <small>de suporte em emergências</small>
                    </div>
                </div>
                <div>
                    <span class="eyebrow">QUEM SOMOS</span>
                    <h2>Segurança começa com uma boa conversa.</h2>
                    <p>Desde 2012, a Souzas Corretora transforma escolhas complexas em decisões tranquilas. Comparamos as melhores seguradoras para encontrar a proteção que realmente faz sentido para você.</p>
                </div>
            </div>
        </section>
        ${quotePage(true)}
        <section class="section auth" id="acesso">
            <div class="wrap auth-grid">
                <div>
                    <span class="eyebrow" style="color:white">ÁREA DO CLIENTE</span>
                    <h2>Sua proteção, sempre por perto.</h2>
                    <p>Acompanhe suas apólices, orçamentos e solicitações em um só lugar.</p>
                    <p>✓ Acesse seus seguros ativos<br>✓ Consulte vencimentos e coberturas<br>✓ Peça ajuda sempre que precisar</p>
                </div>
                ${authForm()}
            </div>
        </section>
        <section class="section gray" id="contato">
            <div class="wrap contact-grid">
                <div>
                    <span class="eyebrow">VAMOS CONVERSAR</span>
                    <h2>Estamos aqui para ajudar.</h2>
                    <p>Tem alguma dúvida ou precisa de orientação? Envie uma mensagem e nosso time entrará em contato.</p>
                    <p>WhatsApp: <b>(19) 97600-0008</b><br>E-mail: <b>contato@souzascorretora.com.br</b></p>
                </div>
                ${contactForm()}
            </div>
        </section>
        <footer class="footer">
            <div class="wrap">${brand()}</div>
        </footer>
        <div class="switcher">${roleSelect()}</div>
    `;
}

function sidebar() {
    let items = S.role === 'client' ? [
        ['overview', '<i class="fa-solid fa-house"></i>', 'Início'],
        ['quotes', '<i class="fa-solid fa-file-invoice-dollar"></i>', 'Orçamentos'],
        ['policies', '<i class="fa-solid fa-shield-halved"></i>', 'Meus seguros'],
        ['contact', '<i class="fa-solid fa-envelope"></i>', 'Contato']
    ] : [
        ['overview', '<i class="fa-solid fa-chart-pie"></i>', 'Visão geral'],
        ['orders', '<i class="fa-solid fa-boxes-stacked"></i>', 'Pedidos'],
        ['quotes', '<i class="fa-solid fa-file-invoice-dollar"></i>', 'Orçamentos'],
        ...(S.role === 'admin' ? [['comments', '<i class="fa-solid fa-comments"></i>', 'Comentários']] : [])
    ];

    return `
        <aside class="sidebar">
            ${brand()}
            <div class="profile">
                <b>${S.role === 'client' ? 'Mariana Costa' : S.role === 'admin' ? 'Amanda Souza' : 'Rafael Lima'}</b>
                <small>${roles[S.role]}</small>
            </div>
            <small style="color:#b8c6df;letter-spacing:2px">MENU PRINCIPAL</small>
            <nav class="side-nav">
                ${items.map(([id, icon, label]) => `
                    <a href="#" class="side-link ${S.page === id ? 'active' : ''}" data-page="${id}">
                        ${icon} &nbsp; ${label}
                    </a>
                `).join('')}
            </nav>
            <div class="side-bottom">
                <a href="#" data-role="guest">← Sair da conta</a>
            </div>
        </aside>
    `;
}

function table(rows) {
    return `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        ${['PEDIDO', 'CLIENTE', 'SEGURO', 'RECEBIDO', 'VALOR', 'STATUS', ''].map(x => `<th>${x}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(o => `
                        <tr data-order="${o.id}" style="${S.order === o.id ? 'background:#edf2f8' : ''}">
                            <td><b>#${o.id}</b></td>
                            <td>${o.name}</td>
                            <td>${o.type}</td>
                            <td>${o.date}</td>
                            <td><b>${money(o.value)}</b></td>
                            <td><span class="status">${o.status}</span></td>
                            <td>❯</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function overview() {
    if (S.role === 'client') return `
        <div class="welcome">
            <span class="eyebrow" style="color:white">BOA TARDE, MARIANA</span>
            <h2>Está tudo protegido por aqui.</h2>
            <p>Você tem 2 seguros ativos e nenhuma pendência.</p>
            <button class="btn outline" data-page="policies">Ver meus seguros →</button>
        </div>
        <div class="analytics">
            <div class="panel">
                <h3>Seus seguros</h3>
                ${['Seguro Auto', 'Seguro Residencial'].map((x, i) => `
                    <div class="summary-item line">
                        <b>${x}</b>
                        <span class="status">Ativo</span>
                        <span>Vencimento: ${i ? '04 Mar 2026' : '18 Dez 2025'}</span>
                    </div>
                `).join('')}
            </div>
            <div class="panel">
                <h3>Precisa de ajuda?</h3>
                <p>Em caso de sinistro, nossa equipe está disponível 24 horas.</p>
                <a class="btn outline" href="https://wa.me/5519976000008">Falar agora</a>
            </div>
        </div>
        <h3>Acesso rápido</h3>
        <div class="quick">
            ${[['quotes', 'Novo orçamento'], ['policies', 'Meus documentos'], ['contact', 'Falar com a Souzas']].map(([id, name]) => `
                <div class="panel" data-page="${id}">＋ &nbsp; ${name}</div>
            `).join('')}
        </div>
    `;

    return `
        <div class="metric-grid">
            ${[['Orçamentos no mês', '184'], ['Pedidos recebidos', '76'], ['Seguros ativos', '1.248'], ['Aguardando análise', '18']].map(([a, b]) => `
                <div class="panel metric">
                    <small>${a}</small>
                    <b>${b}</b>
                    <small>Acompanhe os indicadores</small>
                </div>
            `).join('')}
        </div>
        <div class="analytics">
            <div class="panel">
                <h3>Orçamentos e pedidos</h3>
                <p>Desempenho dos últimos 6 meses</p>
                <div class="bars">
                    ${[45, 61, 53, 70, 65, 80].map(v => `
                        <div class="barpair">
                            <div class="bar" style="height:${v}%"></div>
                            <div class="bar graybar" style="height:${v * .6}%"></div>
                        </div>
                    `).join('')}
                </div>
                <p>Jan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fev &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Mar &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Abr &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Mai &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Jun</p>
            </div>
            <div class="panel">
                <h3>Seguros mais procurados</h3>
                ${[68, 45, 38, 25].map((v, i) => `
                    <div class="rank">
                        ${products[i][1]} <b style="float:right">${v}</b>
                        <div class="progress"><i style="width:${v / 68 * 100}%"></i></div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="panel">
            <h3>Pedidos recentes</h3>
            ${table(S.orders.slice(0, 4))}
        </div>
    `;
}

function ordersPage() {
    return `
        <span class="eyebrow">OPERAÇÃO</span>
        <h2>Pedidos de seguro</h2>
        <p>Acompanhe as novas solicitações e documentos.</p>
        <div class="panel">
            <h3>Gestão de pedidos</h3>
            <p>Analise, anexe contratos e acompanhe cada solicitação.</p>
            <div style="display:flex;gap:12px;margin-bottom:20px">
                <input id="search" placeholder="Buscar" style="padding:12px;border:1px solid #ddd">
                <select id="filter" style="padding:12px;border:1px solid #ddd">
                    ${['Todos os status', 'Novo', 'Em análise', 'Documentação', 'Aprovado', 'Finalizado', 'Cancelado'].map(x => `<option ${S.filter === x ? 'selected' : ''}>${x}</option>`).join('')}
                </select>
            </div>
            ${table(S.orders.filter(o => S.filter === 'Todos os status' || o.status === S.filter))}
            <p>Selecione um pedido na tabela.</p>
            <div class="actions">
                <label class="btn outline">Anexar contrato<input id="file" type="file" accept=".pdf,.doc,.docx" hidden></label>
                <button class="btn" id="finish">✓ Finalizar pedido</button>
                ${S.role === 'admin' ? '<button class="btn outline" id="edit">Alterar</button><button class="btn danger" id="cancel">Cancelar pedido</button>' : ''}
            </div>
        </div>
    `;
}

function policies() {
    const email = String(S.currentUser?.email || '').trim().toLowerCase();
    const userPolicies = S.currentUser
        ? S.policies.filter(p => String(p.customerEmail || '').trim().toLowerCase() === email && p.status !== 'Cancelado')
        : [];

    // Mantém os dois cartões ilustrativos quando a área do cliente é aberta
    // pelo seletor de demonstração, sem uma conta autenticada.
    const demoPolicies = !S.currentUser ? [
        { id: 'DEMO-908', type: 'Seguro Auto', monthlyValue: 189, policyNumber: '01.82.456.908-4', startDate: '18 Dez 2024', endDate: '18 Dez 2025' },
        { id: 'DEMO-231', type: 'Seguro Residencial', monthlyValue: 79, policyNumber: '01.82.456.231-4', startDate: '04 Mar 2025', endDate: '04 Mar 2026' }
    ] : [];
    const visiblePolicies = [...userPolicies, ...demoPolicies];

    return `
        <h2>Meus seguros</h2>
        <p>Consulte seus seguros ativos.</p>
        ${visiblePolicies.length ? visiblePolicies.map(policy => `
            <div class="panel policy">
                <h3><i class="fa-solid fa-shield-halved"></i> ${policy.type} <span class="status" style="float:right">Ativo</span></h3>
                <small>Apólice nº ${policy.policyNumber || policy.id}</small>
                <div class="policy-meta">
                    <div>
                        <small>Vigência</small>
                        <b>${policy.startDate || 'A definir'} – ${policy.endDate || 'A definir'}</b>
                    </div>
                    <div>
                        <small>Assistência 24h</small>
                        <b>0800 777 2020</b>
                    </div>
                    <div>
                        <small>Valor mensal</small>
                        <b>${money(policy.monthlyValue ?? (Number(policy.value || 0) / 12))}</b>
                    </div>
                </div>
                <h4>O que está coberto</h4>
                <div class="coverage">✓ Coberturas conforme proposta &nbsp; ✓ Atendimento da corretora</div>
                <div class="actions">
                    <button class="btn outline" data-policy>Ver apólice</button>
                    <a class="btn" href="tel:08007772020">Acionar seguro</a>
                </div>
            </div>
        `).join('') : '<div class="panel"><h3>Nenhum seguro ativo encontrado</h3><p>Quando um pedido vinculado a esta conta for finalizado pela equipe, o seguro aparecerá aqui.</p></div>'}
    `;
}

function commentsPage() {
    return `
        <span class="eyebrow">ATENDIMENTO</span>
        <h2>Comentários de clientes</h2>
        <p>Mensagens enviadas através do formulário de contato.</p>
        ${S.comments.map((c, i) => `
            <div class="panel comment">
                <b>${c.name}</b>
                <p>${c.email} · ${c.phone} · ${c.date}</p>
                <div class="comment-body">${c.message}</div>
                <button class="btn outline" data-reply="${i}">✉ Responder</button>
                <button class="btn outline" data-read="${i}">${c.read ? '✓ Lido' : 'Marcar como lido'}</button>
            </div>
        `).join('')}
    `;
}

function dashboard() {
    let pages = {
        overview,
        quotes: quotePage,
        orders: ordersPage,
        policies,
        comments: commentsPage,
        contact: () => `
            <h2>Como podemos ajudar?</h2>
            <p>Nossa equipe responderá em até um dia útil.</p>
            <div class="contact-grid">
                ${contactForm()}
                <div class="panel">
                    <h3>Prefere falar agora?</h3>
                    <p>Chame nosso time pelo WhatsApp.</p>
                    <b>(19) 97600-0008</b>
                </div>
            </div>
        `
    };

    let labels = {
        overview: S.role === 'client' ? 'Início' : 'Visão geral',
        quotes: 'Orçamentos',
        orders: 'Pedidos',
        policies: 'Meus seguros',
        comments: 'Comentários',
        contact: 'Contato'
    };

    return `
        <div class="dashboard">
            ${sidebar()}
            <div>
                <header class="dash-header">
                    <div>
                        <h3>${labels[S.page]}</h3>
                        <small>${S.role === 'client' ? 'Olá, Mariana. Que bom ter você por aqui.' : 'Acompanhe os principais dados da corretora.'}</small>
                    </div>
                    <div class="switch-inline">${roleSelect()}</div>
                </header>
                <main class="dash-content">${(pages[S.page] || overview)()}</main>
            </div>
        </div>
    `;
}

function render() {
    app.innerHTML = S.role === 'guest' ? publicPage() : dashboard();
    bind();
}

function changeRole(r, user = null) {
    S.role = r;
    S.currentUser = r === 'client' ? user : null;
    S.quotes = loadQuotes(r, S.currentUser);
    S.editingQuoteId = null;
    S.page = 'overview';
    S.selected = ['auto'];
    render();
    scrollTo(0, 0);
}

function navigate(page) {
    S.page = page;
    S.editingQuoteId = null;
    render();
    scrollTo(0, 0);
}

function makePolicyFromOrder(order) {
    const customerEmail = String(order.customerEmail || order.email || '').trim().toLowerCase();
    if (!customerEmail) return false;

    let policy = S.policies.find(p => p.orderId === order.id);
    if (!policy) {
        const now = new Date();
        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 1);
        const policyId = 'SEG-' + String(Date.now()).slice(-7);
        policy = {
            id: policyId,
            orderId: order.id,
            policyNumber: 'SZ-' + String(Date.now()).slice(-8),
            customerEmail,
            customerName: order.name,
            type: order.type,
            monthlyValue: Number(order.monthlyValue ?? (Number(order.value || 0) / 12)),
            value: Number(order.value || 0),
            status: 'Ativo',
            startDate: now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            endDate: end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            createdAt: now.toISOString()
        };
        S.policies.unshift(policy);
    } else {
        policy.status = 'Ativo';
    }
    save('sz_policies', S.policies);
    return true;
}

function orderStatus(status) {
    let o = S.orders.find(o => o.id === S.order);
    if (!o) return toast('Selecione um pedido.');

    if (status === 'Finalizado' && !String(o.customerEmail || o.email || '').trim()) {
        const email = prompt('Informe o e-mail da conta do cliente para vincular o seguro em “Meus seguros”:');
        if (!email) return;
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) return toast('Informe um e-mail válido.');
        o.customerEmail = email.trim().toLowerCase();
    }

    o.status = status;
    let linked = false;
    if (status === 'Finalizado') {
        o.finalizedAt = new Date().toISOString();
        linked = makePolicyFromOrder(o);
    } else if (status === 'Cancelado') {
        const policy = S.policies.find(p => p.orderId === o.id);
        if (policy) {
            policy.status = 'Cancelado';
            save('sz_policies', S.policies);
        }
    }

    save('sz_orders', S.orders);
    render();
    if (status === 'Finalizado' && linked) toast('Pedido finalizado! O seguro foi adicionado à conta do cliente.');
    else if (status === 'Finalizado') toast('Pedido finalizado, mas não foi possível vincular o seguro a uma conta.');
    else toast('Pedido atualizado!');
}

function bind() {
    document.querySelectorAll('#role').forEach(el => el.onchange = e => changeRole(e.target.value));
    document.querySelectorAll('[data-role]').forEach(el => el.onclick = e => { e.preventDefault(); changeRole(el.dataset.role); });
    document.querySelectorAll('[data-page]').forEach(el => el.onclick = e => { e.preventDefault(); navigate(el.dataset.page); });
    document.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => { S.tab = el.dataset.tab; render(); $('#acesso')?.scrollIntoView(); });
    document.querySelectorAll('[data-product]').forEach(el => el.onclick = () => {
        let y = scrollY, id = el.dataset.product;
        S.selected = S.selected.includes(id) ? S.selected.filter(x => x !== id) : [...S.selected, id];
        render();
        scrollTo(0, y);
    });

    $('#save-quote')?.addEventListener('click', () => {
        if (!S.selected.length) return toast('Selecione pelo menos um seguro.');
        const items = [...S.selected];
        const total = products.filter(p => items.includes(p[0])).reduce((sum, p) => sum + p[3], 0);

        if (S.editingQuoteId) {
            const quoteToEdit = S.quotes.find(q => q.id === S.editingQuoteId);
            if (!quoteToEdit) {
                S.editingQuoteId = null;
                return toast('Este orçamento não foi encontrado.');
            }
            quoteToEdit.items = items;
            quoteToEdit.total = total;
            quoteToEdit.updatedAt = new Date().toISOString();
            S.editingQuoteId = null;
            persistQuotes();
            render();
            toast('Orçamento atualizado!');
            return;
        }

        S.quotes.unshift({
            id: String(Date.now()).slice(-8),
            items,
            total,
            createdAt: new Date().toISOString()
        });
        persistQuotes();
        render();
        toast('Orçamento salvo!');
    });

    $('#cancel-edit')?.addEventListener('click', () => {
        S.editingQuoteId = null;
        S.selected = ['auto'];
        render();
        toast('Edição cancelada.');
    });

    document.querySelectorAll('[data-request]').forEach(el => el.onclick = () => {
        if (S.role === 'guest') {
            toast('Você precisa se cadastrar para pedir um seguro.');
            S.tab = 'register';
            render();
            $('#acesso')?.scrollIntoView();
            return;
        }
        let q = S.quotes.find(q => q.id === el.dataset.request);
        if (!q) return toast('Orçamento não encontrado.');
        let name = prompt('Nome completo do solicitante:', S.currentUser?.name || 'Mariana Costa');
        if (!name) return;
        let email = prompt('E-mail para contato:', S.currentUser?.email || '');
        if (!email) return;
        let phone = prompt('Telefone:', S.currentUser?.phone || '');
        if (!phone) return;
        let info = prompt('Informações adicionais:', '');
        if (info === null) return;

        S.orders.unshift({
            id: 'PED-' + String(Date.now()).slice(-7),
            name,
            type: q.items.map(id => products.find(p => p[0] === id)?.[1] || id).join(' + '),
            date: new Date().toLocaleString('pt-BR'),
            value: q.total * 12,
            monthlyValue: q.total,
            status: 'Novo',
            email,
            customerEmail: String(S.currentUser?.email || email).trim().toLowerCase(),
            phone,
            info,
            requestedByRole: S.role
        });
        save('sz_orders', S.orders);
        render();
        toast('Pedido registrado com sucesso!');
    });

    document.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => {
        const q = S.quotes.find(item => item.id === el.dataset.edit);
        if (!q) return toast('Orçamento não encontrado.');
        S.editingQuoteId = q.id;
        S.selected = [...q.items];
        render();
        document.querySelector('#quote-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.querySelectorAll('[data-delete]').forEach(el => el.onclick = () => {
        const id = el.dataset.delete;
        const q = S.quotes.find(item => item.id === id);
        if (!q) return toast('Orçamento não encontrado.');
        if (!confirm('Tem certeza de que deseja excluir este orçamento?')) return;
        S.quotes = S.quotes.filter(item => item.id !== id);
        if (S.editingQuoteId === id) {
            S.editingQuoteId = null;
            S.selected = ['auto'];
        }
        persistQuotes();
        render();
        toast('Orçamento excluído.');
    });

    $('#contact')?.addEventListener('submit', e => {
        e.preventDefault();
        S.comments.unshift({ ...Object.fromEntries(new FormData(e.target)), date: new Date().toLocaleString('pt-BR') });
        save('sz_comments', S.comments);
        e.target.reset();
        toast('Mensagem registrada!');
    });

    $('#register')?.addEventListener('submit', e => {
        e.preventDefault();
        let a = Object.fromEntries(new FormData(e.target));
        if (S.accounts.some(x => x.email === a.email)) return toast('E-mail já cadastrado.');
        S.accounts.push(a);
        save('sz_accounts', S.accounts);
        S.tab = 'login';
        render();
        $('#acesso')?.scrollIntoView();
        toast('Conta de demonstração criada!');
    });

    $('#login')?.addEventListener('submit', e => {
        e.preventDefault();
        let credentials = Object.fromEntries(new FormData(e.target));
        const account = S.accounts.find(x => String(x.email).toLowerCase() === String(credentials.email).toLowerCase() && x.password === credentials.password);
        if (!account) return toast('E-mail ou senha inválidos.');
        changeRole('client', account);
        toast('Bem-vindo!');
    });

    document.querySelectorAll('[data-order]').forEach(el => el.onclick = () => {
        S.order = el.dataset.order;
        render();
        toast('Pedido ' + S.order + ' selecionado');
    });

    $('#filter')?.addEventListener('change', e => { S.filter = e.target.value; render(); });
    $('#search')?.addEventListener('input', e => {
        document.querySelectorAll('[data-order]').forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(e.target.value.toLowerCase()) ? '' : 'none');
    });

    $('#file')?.addEventListener('change', e => {
        let o = S.orders.find(o => o.id === S.order);
        if (!o) return toast('Selecione um pedido.');
        o.contract = e.target.files[0]?.name;
        save('sz_orders', S.orders);
        toast('Nome do arquivo registrado; envio real requer backend.');
    });

    $('#finish')?.addEventListener('click', () => orderStatus('Finalizado'));
    $('#cancel')?.addEventListener('click', () => { if (confirm('Cancelar pedido?')) orderStatus('Cancelado'); });
    $('#edit')?.addEventListener('click', () => {
        let o = S.orders.find(o => o.id === S.order);
        if (!o) return toast('Selecione um pedido.');
        let v = prompt('Novo status:', o.status);
        if (v) orderStatus(v);
    });

    document.querySelectorAll('[data-reply]').forEach(el => el.onclick = () => { location.href = 'mailto:' + S.comments[+el.dataset.reply].email; });
    document.querySelectorAll('[data-read]').forEach(el => el.onclick = () => { S.comments[+el.dataset.read].read = true; save('sz_comments', S.comments); render(); });
    document.querySelectorAll('[data-policy]').forEach(el => el.onclick = () => toast('Adicione o arquivo real da apólice para disponibilizar download.'));
}

render();