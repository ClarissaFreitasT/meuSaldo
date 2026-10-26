import { useEffect, useMemo, useState } from "react";
import { api, mensagemErro } from "./api.js";
import { Wallet, LayoutDashboard, ArrowLeftRight, CalendarCheck, LogOut, Plus, TrendingUp, TrendingDown, CircleDollarSign, Search, X, CheckCircle2, LockKeyhole, Menu, ChevronDown, PiggyBank, LoaderCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const today = new Date();
const dateISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const blankForm = () => ({ descricao: "", valor: "", tipo: "DESPESA", categoria: "Alimentação", data: dateISO() });
const categories = { ENTRADA: ["Salário", "Mesada", "Presente", "Vendas", "Outros"], DESPESA: ["Alimentação", "Transporte", "Moradia", "Estudos", "Saúde", "Lazer", "Contas", "Outros"] };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("meusaldo_token"));
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("meusaldo_usuario")); } catch { return null; } });
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [month, setMonth] = useState(today.getMonth()+1);
  const [year, setYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [filter, setFilter] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [authForm, setAuthForm] = useState({ nome: "", email: "", senha: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (token) loadData(); }, [token, month, year]);
  async function loadData() {
    setLoading(true); setError("");
    try {
      const [s, m, c] = await Promise.all([
        api.get(`/dashboard?mes=${month}&ano=${year}`),
        api.get(`/movimentacoes?mes=${month}&ano=${year}`),
        api.get("/fechamentos")
      ]);
      setSummary(s.data); setMovements(m.data.movimentacoes); setClosings(c.data.fechamentos);
    } catch (e) { setError(mensagemErro(e)); if (e.response?.status === 401) logout(false); }
    finally { setLoading(false); }
  }
  function logout(showMessage = true) {
    localStorage.removeItem("meusaldo_token"); localStorage.removeItem("meusaldo_usuario");
    setToken(null); setUser(null); setSummary(null); setMovements([]); setClosings([]);
    if (showMessage) setNotice("Você saiu da sua conta.");
  }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const url = authMode === "login" ? "/auth/login" : "/auth/register";
      const response = await api.post(url, authForm);
      localStorage.setItem("meusaldo_token", response.data.token);
      localStorage.setItem("meusaldo_usuario", JSON.stringify(response.data.usuario));
      setToken(response.data.token); setUser(response.data.usuario); setNotice("Bem-vinda(o) ao MeuSaldo!");
    } catch (e) { setError(mensagemErro(e)); }
    finally { setBusy(false); }
  }
  function openCreate() { setEditing(null); setForm(blankForm()); setShowForm(true); setError(""); }
  function openEdit(item) {
    setEditing(item.id); setForm({ descricao: item.descricao, valor: String(item.valor), tipo: item.tipo, categoria: item.categoria, data: String(item.data).slice(0,10) }); setShowForm(true); setError("");
  }
  async function submitMovement(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const body = { ...form, valor: Number(String(form.valor).replace(",", ".")) };
      if (editing) await api.put(`/movimentacoes/${editing}`, body); else await api.post("/movimentacoes", body);
      setShowForm(false); setNotice(editing ? "Movimentação atualizada." : "Movimentação cadastrada."); await loadData();
    } catch (e) { setError(mensagemErro(e)); }
    finally { setBusy(false); }
  }
  async function deleteMovement(item) {
    if (!confirm(`Excluir “${item.descricao}”?`)) return;
    setError("");
    try { await api.delete(`/movimentacoes/${item.id}`); setNotice("Movimentação excluída."); await loadData(); }
    catch (e) { setError(mensagemErro(e)); }
  }
  async function closeMonth() {
    if (!confirm(`Encerrar ${monthNames[month-1]} de ${year}? Depois disso, as movimentações desse mês não poderão ser alteradas.`)) return;
    setError("");
    try { const r = await api.post("/fechamentos", { mes: month, ano: year }); setNotice(r.data.mensagem); await loadData(); }
    catch (e) { setError(mensagemErro(e)); }
  }
  const isClosed = Boolean(summary?.encerrado);
  const filtered = useMemo(() => movements.filter(m => (filter === "TODOS" || m.tipo === filter) && `${m.descricao} ${m.categoria}`.toLowerCase().includes(search.toLowerCase())), [movements, filter, search]);
  const chartData = useMemo(() => {
    const days = new Map();
    movements.forEach(m => { const d = String(m.data).slice(0,10); const current = days.get(d) || { data: d.slice(8,10)+"/"+d.slice(5,7), entradas: 0, despesas: 0 }; current[m.tipo === "ENTRADA" ? "entradas" : "despesas"] += Number(m.valor); days.set(d,current); });
    return [...days.values()].sort((a,b)=>a.data.localeCompare(b.data));
  }, [movements]);

  if (!token) return <AuthScreen mode={authMode} setMode={setAuthMode} values={authForm} setValues={setAuthForm} onSubmit={submitAuth} busy={busy} error={error} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Wallet size={21}/></span><span>MeuSaldo<span className="brand-dot">.</span><small>CONTROLE FINANCEIRO</small></span></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav className="nav-list">
        <button className={page === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setPage("dashboard")}><LayoutDashboard size={18}/> Visão geral</button>
        <button className={page === "movements" ? "nav-item active" : "nav-item"} onClick={() => setPage("movements")}><ArrowLeftRight size={18}/> Movimentações</button>
        <button className={page === "closings" ? "nav-item active" : "nav-item"} onClick={() => setPage("closings")}><CalendarCheck size={18}/> Fechamento mensal</button>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><PiggyBank size={20}/></div><strong>Pequenos passos,</strong><strong>mais clareza.</strong><p>Organize seu dinheiro no seu ritmo.</p></div><div className="user-row"><div className="avatar">{(user?.nome || "U").slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{user?.nome || "Minha conta"}</strong><span>{user?.email || ""}</span></div><button className="icon-button" title="Sair" onClick={() => logout()}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><span className="eyebrow">SEU ESPAÇO FINANCEIRO</span><h1>{page === "dashboard" ? "Visão geral" : page === "movements" ? "Movimentações" : "Fechamento mensal"}</h1></div><div className="topbar-actions"><div className="month-picker"><CalendarCheck size={16}/><select value={month} onChange={e=>setMonth(Number(e.target.value))}>{monthNames.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select><select value={year} onChange={e=>setYear(Number(e.target.value))}>{[year-2,year-1,year,year+1].map(y=><option key={y}>{y}</option>)}</select><ChevronDown size={14}/></div><button className="primary-button" onClick={openCreate} disabled={isClosed}><Plus size={17}/> Nova movimentação</button></div></header>
      {notice && <div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
      {error && <div className="alert"><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
      {loading && <div className="loading-line"><LoaderCircle className="spin" size={16}/> Atualizando seus dados…</div>}
      {page === "dashboard" && <>
        <section className="welcome-row"><div><h2>Olá, {user?.nome?.split(" ")[0] || "por aqui"} 👋</h2><p>Acompanhe como seu dinheiro está fluindo neste mês.</p></div><span className={isClosed ? "status-pill closed" : "status-pill open"}><span/> {isClosed ? "Mês encerrado" : "Mês em andamento"}</span></section>
        <section className="summary-grid">
          <SummaryCard label="Saldo do mês" value={money(summary?.saldo)} icon={<CircleDollarSign/>} tone="green" helper="Entradas menos despesas"/>
          <SummaryCard label="Total de entradas" value={money(summary?.entradas)} icon={<TrendingUp/>} tone="mint" helper="Dinheiro que entrou"/>
          <SummaryCard label="Total de despesas" value={money(summary?.despesas)} icon={<TrendingDown/>} tone="rose" helper="Dinheiro que saiu"/>
        </section>
        <section className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Movimentações do mês</h3><p>Distribuição das entradas e despesas registradas</p></div><span className="soft-icon"><ArrowLeftRight size={18}/></span></div>{chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:6,left:-18,bottom:0}}><defs><linearGradient id="inFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f8c68" stopOpacity={0.2}/><stop offset="100%" stopColor="#4f8c68" stopOpacity={0}/></linearGradient><linearGradient id="outFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d28b82" stopOpacity={0.18}/><stop offset="100%" stopColor="#d28b82" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ece7"/><XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill:"#8a948b",fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:"#8a948b",fontSize:11}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>money(v)} contentStyle={{borderRadius:12,border:"1px solid #e5e9e3",fontSize:12}}/><Area type="monotone" dataKey="entradas" name="Entradas" stroke="#4f8c68" fill="url(#inFill)" strokeWidth={2.5}/><Area type="monotone" dataKey="despesas" name="Despesas" stroke="#d28b82" fill="url(#outFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div> : <EmptyState icon={<TrendingUp size={22}/>} title="Seu gráfico começa aqui" text="Cadastre uma entrada ou despesa para visualizar seu movimento financeiro." action="Adicionar movimentação" onClick={openCreate}/>}</div>
          <div className="panel recent-panel"><div className="panel-heading"><div><h3>Últimas movimentações</h3><p>Seus registros mais recentes</p></div><button className="text-button" onClick={()=>setPage("movements")}>Ver todas <span>→</span></button></div>{movements.slice(0,5).length ? <div className="recent-list">{movements.slice(0,5).map(m=><MovementRow key={m.id} item={m} compact/>)}</div> : <EmptyState icon={<Wallet size={22}/>} title="Nada por enquanto" text="Suas movimentações aparecerão aqui." action="Criar registro" onClick={openCreate}/>}</div></section>
        <section className="bottom-banner"><div className="banner-icon"><LockKeyhole size={21}/></div><div><strong>Suas finanças, do seu jeito.</strong><p>Seus registros são privados e só você pode acessá-los.</p></div><button className="secondary-button" onClick={()=>setPage("closings")}>Ver fechamento mensal <span>→</span></button></section>
      </>}
      {page === "movements" && <section className="panel table-panel"><div className="panel-heading table-heading"><div><h3>Suas movimentações</h3><p>{filtered.length} registro(s) em {monthNames[month-1].toLowerCase()} de {year}</p></div><button className="primary-button" onClick={openCreate} disabled={isClosed}><Plus size={17}/> Adicionar</button></div><div className="filters-row"><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar descrição ou categoria"/></div><div className="filter-tabs">{[["TODOS","Todas"],["ENTRADA","Entradas"],["DESPESA","Despesas"]].map(([v,l])=><button key={v} className={filter===v?"filter-tab selected":"filter-tab"} onClick={()=>setFilter(v)}>{l}</button>)}</div></div>{isClosed && <div className="inline-info"><LockKeyhole size={16}/> Este mês está encerrado. Você pode consultar os registros, mas não alterá-los.</div>}{filtered.length ? <div className="table-scroll"><table><thead><tr><th>Movimentação</th><th>Categoria</th><th>Data</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead><tbody>{filtered.map(item=><tr key={item.id}><td><div className="table-description"><span className={item.tipo==="ENTRADA"?"transaction-icon income":"transaction-icon expense"}>{item.tipo==="ENTRADA"?<TrendingUp size={17}/>:<TrendingDown size={17}/>}</span><strong>{item.descricao}</strong></div></td><td><span className="category-tag">{item.categoria}</span></td><td>{new Date(`${String(item.data).slice(0,10)}T12:00:00`).toLocaleDateString("pt-BR")}</td><td><span className={item.tipo==="ENTRADA"?"type-text income-text":"type-text expense-text"}>{item.tipo==="ENTRADA"?"Entrada":"Despesa"}</span></td><td className={item.tipo==="ENTRADA"?"amount income-text":"amount expense-text"}>{item.tipo==="ENTRADA"?"+ ":"− "}{money(item.valor)}</td><td><div className="row-actions"><button className="small-action" disabled={isClosed} onClick={()=>openEdit(item)}>Editar</button><button className="small-action delete-action" disabled={isClosed} onClick={()=>deleteMovement(item)}>Excluir</button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={<Search size={22}/>} title="Nenhum registro encontrado" text="Tente mudar os filtros ou adicione uma movimentação." action="Nova movimentação" onClick={openCreate}/>}</section>}
      {page === "closings" && <section className="closing-layout"><div className="panel closing-main"><div className="closing-illustration"><div className="closing-circle"><CalendarCheck size={34}/></div></div><span className="eyebrow">ORGANIZAÇÃO MENSAL</span><h2>Feche o mês com clareza.</h2><p>Ao encerrar um mês, suas movimentações ficam disponíveis para consulta, mas não poderão mais ser criadas, editadas ou excluídas naquele período.</p><div className="closing-totals"><div><span>Entradas</span><strong className="income-text">{money(summary?.entradas)}</strong></div><div><span>Despesas</span><strong className="expense-text">{money(summary?.despesas)}</strong></div><div><span>Saldo</span><strong>{money(summary?.saldo)}</strong></div></div><div className="closing-selected"><CalendarCheck size={18}/><span>{monthNames[month-1]} de {year}</span><span className={isClosed?"status-pill closed":"status-pill open"}>{isClosed?"Encerrado":"Em andamento"}</span></div>{isClosed ? <div className="closed-message"><CheckCircle2 size={18}/> Este mês já foi encerrado.</div> : <button className="primary-button full-button" onClick={closeMonth}>Encerrar este mês <span>→</span></button>}<small className="muted-note">O fechamento não pode ser desfeito pela interface.</small></div><div className="panel history-panel"><div className="panel-heading"><div><h3>Histórico de fechamentos</h3><p>Meses já encerrados</p></div><span className="soft-icon"><LockKeyhole size={18}/></span></div>{closings.length ? <div className="closing-history">{closings.map(c=><button className="history-item" key={c.id} onClick={()=>{setMonth(c.mes);setYear(c.ano);setPage("closings");}}><span className="history-check"><CheckCircle2 size={17}/></span><span><strong>{monthNames[c.mes-1]} de {c.ano}</strong><small>Encerrado em {new Date(c.encerradoEm).toLocaleDateString("pt-BR")}</small></span><span className="history-arrow">↗</span></button>)}</div> : <EmptyState icon={<CalendarCheck size={22}/>} title="Nenhum mês encerrado" text="Quando você encerrar um mês, ele aparecerá aqui."/>}</div></section>}
    </main>
    {showForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false);}}><section className="modal-card"><div className="modal-heading"><div><span className="eyebrow">NOVA MOVIMENTAÇÃO</span><h2>{editing?"Editar movimentação":"Adicionar movimentação"}</h2><p>Preencha os detalhes do seu registro.</p></div><button className="icon-button modal-close" onClick={()=>setShowForm(false)}><X size={20}/></button></div>{error && <div className="alert"><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}<form onSubmit={submitMovement} className="form-grid"><label className="field full-field"><span>Tipo de movimentação</span><div className="type-selector"><button type="button" className={form.tipo==="ENTRADA"?"type-option selected income-selected":"type-option"} onClick={()=>setForm({...form,tipo:"ENTRADA",categoria:categories.ENTRADA.includes(form.categoria)?form.categoria:"Salário"})}><TrendingUp size={17}/> Entrada</button><button type="button" className={form.tipo==="DESPESA"?"type-option selected expense-selected":"type-option"} onClick={()=>setForm({...form,tipo:"DESPESA",categoria:categories.DESPESA.includes(form.categoria)?form.categoria:"Alimentação"})}><TrendingDown size={17}/> Despesa</button></div></label><label className="field full-field"><span>Descrição</span><input required minLength="2" maxLength="120" placeholder="Ex.: Compra no mercado" value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/></label><label className="field"><span>Valor (R$)</span><input required type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})}/></label><label className="field"><span>Data</span><input required type="date" value={form.data} onChange={e=>setForm({...form,data:e.target.value})}/></label><label className="field full-field"><span>Categoria</span><select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>{categories[form.tipo].map(c=><option key={c}>{c}</option>)}</select></label><div className="form-actions full-field"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Cancelar</button><button className="primary-button" disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:<CheckCircle2 size={16}/>} {editing?"Salvar alterações":"Salvar movimentação"}</button></div></form></section></div>}
  </div>;
}

function SummaryCard({label,value,icon,tone,helper}) { return <div className="summary-card"><div className="summary-top"><span>{label}</span><span className={`summary-icon ${tone}`}>{icon}</span></div><strong className="summary-value">{value ?? "—"}</strong><span className="summary-helper">{helper}</span></div>; }
function MovementRow({item,compact=false}) { return <div className="recent-item"><span className={item.tipo==="ENTRADA"?"transaction-icon income":"transaction-icon expense"}>{item.tipo==="ENTRADA"?<TrendingUp size={17}/>:<TrendingDown size={17}/>}</span><div className="recent-description"><strong>{item.descricao}</strong><span>{item.categoria} · {new Date(`${String(item.data).slice(0,10)}T12:00:00`).toLocaleDateString("pt-BR")}</span></div><strong className={item.tipo==="ENTRADA"?"recent-amount income-text":"recent-amount expense-text"}>{item.tipo==="ENTRADA"?"+":"−"}{money(item.valor)}</strong></div>; }
function EmptyState({icon,title,text,action,onClick}) { return <div className="empty-state"><span className="empty-icon">{icon}</span><strong>{title}</strong><p>{text}</p>{action && <button className="text-button" onClick={onClick}>{action} →</button>}</div>; }
function AuthScreen({mode,setMode,values,setValues,onSubmit,busy,error}) { return <main className="auth-page"><div className="auth-decoration decoration-one"/><div className="auth-decoration decoration-two"/><section className="auth-brand-side"><div className="brand auth-brand"><span className="brand-mark"><Wallet size={22}/></span><span>MeuSaldo<span className="brand-dot">.</span><small>CONTROLE FINANCEIRO</small></span></div><div className="auth-message"><span className="eyebrow">MAIS CLAREZA, MENOS COMPLICAÇÃO</span><h1>Cuide do seu dinheiro.<br/><em>Do seu jeito.</em></h1><p>Um lugar simples para acompanhar o que entra, organizar o que sai e enxergar seu saldo com mais tranquilidade.</p><div className="auth-benefits"><span><CheckCircle2 size={17}/> Entradas e despesas em um só lugar</span><span><CheckCircle2 size={17}/> Resumo mensal fácil de entender</span><span><CheckCircle2 size={17}/> Seus registros são privados</span></div></div><div className="auth-footer">Organização financeira, um passo de cada vez.</div></section><section className="auth-form-side"><div className="auth-form-card"><div className="mobile-brand"><span className="brand-mark"><Wallet size={20}/></span><strong>MeuSaldo<span className="brand-dot">.</span></strong></div><span className="eyebrow">BEM-VINDA(O) AO MEUSALDO</span><h2>{mode==="login"?"Que bom ter você aqui.":"Vamos começar?"}</h2><p className="auth-subtitle">{mode==="login"?"Entre na sua conta para acompanhar suas finanças.":"Crie sua conta e organize suas finanças em um só lugar."}</p>{error && <div className="alert"><span>{error}</span></div>}<form onSubmit={onSubmit} className="auth-form">{mode==="register" && <label className="field"><span>Nome</span><input required minLength="2" maxLength="80" autoComplete="name" placeholder="Como podemos te chamar?" value={values.nome} onChange={e=>setValues({...values,nome:e.target.value})}/></label>}<label className="field"><span>E-mail</span><input required type="email" autoComplete="email" placeholder="voce@exemplo.com" value={values.email} onChange={e=>setValues({...values,email:e.target.value})}/></label><label className="field"><span>Senha</span><input required minLength="8" type="password" autoComplete={mode==="login"?"current-password":"new-password"} placeholder="Pelo menos 8 caracteres" value={values.senha} onChange={e=>setValues({...values,senha:e.target.value})}/></label><button className="primary-button full-button" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:null}{mode==="login"?"Entrar na minha conta":"Criar minha conta"}<span>→</span></button></form><div className="auth-switch">{mode==="login"?"Ainda não tem uma conta?":"Já tem uma conta?"} <button onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Criar conta":"Fazer login"}</button></div><div className="privacy-note"><LockKeyhole size={15}/> Seus dados são privados e protegidos por autenticação.</div></div><div className="auth-mobile-footer">MeuSaldo · Seu dinheiro, sob seu controle.</div></section></main>; }
