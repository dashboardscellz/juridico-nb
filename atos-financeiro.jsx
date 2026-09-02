import React, { useState, useEffect } from "react";

/* ------------------------------------------------------------------ *
 *  CAIXA DO GRUPO ATOS  —  livro-caixa compartilhado
 *  Visualização aberta a todos, edição só para 2 administradores.
 * ------------------------------------------------------------------ */

const ADMINS = [
  { login: "Manassés Oliveira", senha: "Manassesatos12" },
  { login: "Amanda Almeida", senha: "Amandaatos12" },
];

const STORAGE_KEY = "atos_movimentacoes";

const brl = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n) || 0
  );

const fmtData = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};
const fmtHora = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const parseValor = (str) => {
  if (typeof str !== "string") return NaN;
  const limpo = str.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(limpo);
};

/* Seta desenhada do logo, reaproveitável como marca e como detalhe */
function Seta({ w = 260, color = "#24211c", stroke = 2.4 }) {
  return (
    <svg
      viewBox="0 0 420 60"
      width={w}
      height={(w * 60) / 420}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M406 30 Q 210 24 40 30" strokeWidth={stroke} />
      <path d="M40 30 L 78 13" strokeWidth={stroke} />
      <path d="M40 30 L 78 47" strokeWidth={stroke} />
      <path d="M384 30 L 362 17" strokeWidth={stroke * 0.8} />
      <path d="M394 30 L 372 17" strokeWidth={stroke * 0.8} />
      <path d="M403 30 L 381 17" strokeWidth={stroke * 0.8} />
    </svg>
  );
}

function Logo({ height = 56, word = "#24211c", arrow = "#24211c" }) {
  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <span
        className="atos-word"
        style={{ fontSize: height * 0.66, color: word }}
      >
        ATOS
      </span>
      <div
        style={{
          position: "absolute",
          left: "-16%",
          top: "52%",
          width: "132%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <Seta w="100%" color={arrow} stroke={3.2} />
      </div>
    </div>
  );
}

export default function App() {
  const [movs, setMovs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [storageOk, setStorageOk] = useState(true);

  const [tela, setTela] = useState("viewer");
  const [admin, setAdmin] = useState(null);

  const [loginNome, setLoginNome] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");

  const [tipo, setTipo] = useState("entrada");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [motivo, setMotivo] = useState("");
  const [formErro, setFormErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [filtro, setFiltro] = useState("todos");
  const [confirmarId, setConfirmarId] = useState(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const r = await window.storage.get(STORAGE_KEY, true);
      if (r && r.value) setMovs(JSON.parse(r.value));
      else setMovs([]);
    } catch {
      setMovs([]);
    } finally {
      setCarregando(false);
    }
  }

  async function salvar(proximo) {
    setMovs(proximo);
    try {
      const r = await window.storage.set(STORAGE_KEY, JSON.stringify(proximo), true);
      if (!r) throw new Error("sem retorno");
      setStorageOk(true);
      return true;
    } catch {
      setStorageOk(false);
      return false;
    }
  }

  function entrar() {
    const achou = ADMINS.find(
      (a) =>
        a.login.toLowerCase() === loginNome.trim().toLowerCase() &&
        a.senha === loginSenha
    );
    if (achou) {
      setAdmin(achou.login);
      setTela("admin");
      setLoginNome("");
      setLoginSenha("");
      setLoginErro("");
    } else {
      setLoginErro("Login ou senha incorretos. Confira e tente de novo.");
    }
  }

  function sair() {
    setAdmin(null);
    setTela("viewer");
    setFormErro("");
  }

  async function adicionar() {
    setFormErro("");
    const v = parseValor(valor);
    if (!v || isNaN(v) || v <= 0) {
      setFormErro("Informe um valor válido. Use vírgula para os centavos, ex: 150,00");
      return;
    }
    if (!descricao.trim()) {
      setFormErro(tipo === "entrada" ? "Descreva o que entrou." : "Descreva o que saiu.");
      return;
    }
    if (!motivo.trim()) {
      setFormErro("Informe o motivo da movimentação.");
      return;
    }
    setSalvando(true);
    const nova = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      tipo,
      valor: v,
      descricao: descricao.trim(),
      motivo: motivo.trim(),
      autor: admin,
      data: new Date().toISOString(),
    };
    const ok = await salvar([nova, ...movs]);
    setSalvando(false);
    if (ok) {
      setValor("");
      setDescricao("");
      setMotivo("");
      setTipo("entrada");
    } else {
      setFormErro("Não foi possível salvar agora. Tente novamente.");
    }
  }

  async function remover(id) {
    setConfirmarId(null);
    await salvar(movs.filter((m) => m.id !== id));
  }

  const totalEntradas = movs
    .filter((m) => m.tipo === "entrada")
    .reduce((s, m) => s + m.valor, 0);
  const totalSaidas = movs
    .filter((m) => m.tipo === "saida")
    .reduce((s, m) => s + m.valor, 0);
  const saldo = totalEntradas - totalSaidas;
  const lista = movs.filter((m) => (filtro === "todos" ? true : m.tipo === filtro));

  return (
    <div className="atos-root">
      <style>{estilos}</style>

      {/* FAIXA DE IDENTIDADE */}
      <header className="topo">
        <div className="topo-marca">
          <Logo height={50} word="#f4ecd9" arrow="#cba64f" />
          <span className="topo-sub">Caixa do Grupo</span>
        </div>
        {tela === "admin" ? (
          <div className="topo-admin">
            <span className="topo-quem">{admin}</span>
            <button className="btn-linha-clara" onClick={sair}>
              Sair
            </button>
          </div>
        ) : (
          <button className="btn-contorno" onClick={() => setTela("login")}>
            Entrar como administrador
          </button>
        )}
      </header>

      {/* HERO: SALDO */}
      <section className="saldo-hero">
        <div className="saldo-rot">Saldo em caixa</div>
        <div className={`saldo-num ${saldo < 0 ? "neg" : ""}`}>{brl(saldo)}</div>
        <div className="saldo-seta">
          <Seta w={200} color="#d8cdb2" stroke={2.2} />
        </div>

        <div className="resumo">
          <div className="resumo-col">
            <span className="resumo-rot entrada">Entradas</span>
            <span className="resumo-val">{brl(totalEntradas)}</span>
          </div>
          <div className="resumo-div" />
          <div className="resumo-col">
            <span className="resumo-rot saida">Saídas</span>
            <span className="resumo-val">{brl(totalSaidas)}</span>
          </div>
          <div className="resumo-div" />
          <div className="resumo-col">
            <span className="resumo-rot">Lançamentos</span>
            <span className="resumo-val">{movs.length}</span>
          </div>
        </div>
      </section>

      {!storageOk && (
        <div className="aviso">
          Houve um problema ao salvar neste dispositivo. As alterações podem não ficar
          guardadas. Tente de novo ou recarregue a página.
        </div>
      )}

      {/* PAINEL DO ADMIN */}
      {tela === "admin" && (
        <section className="painel">
          <h2 className="secao-titulo">Nova movimentação</h2>

          <div className="seg">
            <button
              className={`seg-btn ${tipo === "entrada" ? "ativo entrada" : ""}`}
              onClick={() => setTipo("entrada")}
            >
              Entrada
            </button>
            <button
              className={`seg-btn ${tipo === "saida" ? "ativo saida" : ""}`}
              onClick={() => setTipo("saida")}
            >
              Saída
            </button>
          </div>

          <div className="campos">
            <label className="campo campo-valor">
              <span>Valor</span>
              <div className="valor-wrap">
                <em>R$</em>
                <input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
            </label>
            <label className="campo">
              <span>{tipo === "entrada" ? "O que entrou" : "O que saiu"}</span>
              <input
                placeholder={
                  tipo === "entrada" ? "Ex: Oferta do culto" : "Ex: Compra de material"
                }
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </label>
            <label className="campo campo-largo">
              <span>{tipo === "entrada" ? "Por que entrou" : "Por que saiu"}</span>
              <input
                placeholder={
                  tipo === "entrada"
                    ? "Ex: Arrecadação do domingo"
                    : "Ex: Preparo do evento de jovens"
                }
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          </div>

          {formErro && <div className="form-erro">{formErro}</div>}

          <button
            className={`btn-registrar ${tipo}`}
            onClick={adicionar}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Registrar movimentação"}
          </button>
        </section>
      )}

      {/* LIVRO-CAIXA */}
      <section className="livro">
        <div className="livro-topo">
          <h2 className="secao-titulo">Movimentações</h2>
          <div className="filtros">
            {[
              ["todos", "Todas"],
              ["entrada", "Entradas"],
              ["saida", "Saídas"],
            ].map(([v, t]) => (
              <button
                key={v}
                className={`chip ${filtro === v ? "chip-ativo" : ""}`}
                onClick={() => setFiltro(v)}
              >
                {t}
              </button>
            ))}
            <button className="chip chip-icone" onClick={carregar} title="Atualizar">
              ↻
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="vazio">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="vazio">
            {movs.length === 0
              ? "Nenhuma movimentação registrada ainda."
              : "Nenhuma movimentação neste filtro."}
          </div>
        ) : (
          <ul className="linhas">
            {lista.map((m) => (
              <li key={m.id} className={`linha ${m.tipo}`}>
                <div className="linha-esq">
                  <div className="linha-desc">{m.descricao}</div>
                  <div className="linha-motivo">{m.motivo}</div>
                  <div className="linha-meta">
                    <span>{fmtData(m.data)}</span>
                    <span className="sep">·</span>
                    <span>{fmtHora(m.data)}</span>
                    <span className="sep">·</span>
                    <span>{m.autor}</span>
                    {tela === "admin" &&
                      (confirmarId === m.id ? (
                        <span className="confirmar">
                          Excluir?
                          <button className="link-perigo" onClick={() => remover(m.id)}>
                            sim
                          </button>
                          <button
                            className="link-neutro"
                            onClick={() => setConfirmarId(null)}
                          >
                            não
                          </button>
                        </span>
                      ) : (
                        <button
                          className="link-excluir"
                          onClick={() => setConfirmarId(m.id)}
                        >
                          excluir
                        </button>
                      ))}
                  </div>
                </div>
                <div className={`linha-valor ${m.tipo}`}>
                  {m.tipo === "entrada" ? "+" : "−"} {brl(m.valor)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="rodape">
        Aberto a todos do grupo. Somente os administradores registram ou excluem.
      </footer>

      {/* LOGIN */}
      {tela === "login" && (
        <div className="modal-fundo" onClick={() => setTela("viewer")}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-marca">
              <Logo height={44} />
            </div>
            <h3 className="modal-titulo">Entrar como administrador</h3>
            <label className="campo">
              <span>Login</span>
              <input
                autoFocus
                placeholder="Seu nome de login"
                value={loginNome}
                onChange={(e) => setLoginNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && entrar()}
              />
            </label>
            <label className="campo">
              <span>Senha</span>
              <input
                type="password"
                placeholder="Sua senha"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && entrar()}
              />
            </label>
            {loginErro && <div className="form-erro">{loginErro}</div>}
            <div className="modal-acoes">
              <button className="btn-linha" onClick={() => setTela("viewer")}>
                Voltar
              </button>
              <button className="btn-cheio" onClick={entrar}>
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const estilos = `
  .atos-root {
    --tinta: #24211c;
    --tinta-2: #3a352d;
    --tinta-suave: #7a7264;
    --papel: #efe7d6;
    --cartao: #fbf6ec;
    --linha: #e0d6c1;
    --linha-forte: #d3c7ad;
    --entrada: #2f5d43;
    --saida: #9c3b26;
    --ouro: #cba64f;

    max-width: 720px;
    margin: 0 auto;
    padding: 0 0 56px;
    color: var(--tinta);
    background: var(--papel);
    min-height: 100vh;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    box-sizing: border-box;
  }
  .atos-root * { box-sizing: border-box; }

  .atos-word {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    letter-spacing: 0.24em;
    line-height: 1;
    padding-right: 0.24em;
    display: inline-block;
  }

  /* FAIXA */
  .topo {
    background: linear-gradient(180deg, #2b2721, #211d18);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    padding: 20px 26px;
  }
  .topo-marca { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .topo-sub {
    color: #b8ad95;
    font-size: 11px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
  }
  .topo-admin { display: flex; align-items: center; gap: 14px; }
  .topo-quem { color: #f4ecd9; font-size: 13px; font-weight: 600; }

  .btn-contorno {
    background: transparent;
    color: #f4ecd9;
    border: 1px solid #5c5344;
    border-radius: 999px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-contorno:hover { border-color: var(--ouro); color: #fff; }
  .btn-linha-clara {
    background: none; border: none; color: #c3b89f;
    font-size: 13px; cursor: pointer; font-family: inherit; text-decoration: underline;
  }
  .btn-linha-clara:hover { color: #f4ecd9; }

  /* HERO */
  .saldo-hero {
    margin: 26px 22px 0;
    background: var(--cartao);
    border: 1px solid var(--linha);
    border-radius: 16px;
    padding: 30px 30px 22px;
    text-align: center;
    box-shadow: 0 1px 0 rgba(36,33,28,0.05), 0 14px 30px -24px rgba(36,33,28,0.4);
  }
  .saldo-rot {
    font-size: 11px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--tinta-suave);
    margin-bottom: 8px;
  }
  .saldo-num {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: clamp(42px, 11vw, 62px);
    line-height: 1;
    letter-spacing: -0.015em;
    font-variant-numeric: tabular-nums;
  }
  .saldo-num.neg { color: var(--saida); }
  .saldo-seta { display: flex; justify-content: center; margin: 14px 0 2px; opacity: 0.9; }

  .resumo {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 4px;
    margin-top: 14px;
    padding-top: 18px;
    border-top: 1px solid var(--linha);
  }
  .resumo-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    min-width: 0;
  }
  .resumo-rot { font-size: 12px; color: var(--tinta-suave); font-weight: 600; }
  .resumo-rot.entrada { color: var(--entrada); }
  .resumo-rot.saida { color: var(--saida); }
  .resumo-val {
    font-family: Georgia, serif;
    font-weight: 700;
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }
  .resumo-div { width: 1px; background: var(--linha); }

  .aviso {
    margin: 18px 22px 0;
    background: #f6e6de;
    border: 1px solid #e2c1b4;
    color: #8a3320;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
  }

  /* PAINEL FORM */
  .painel {
    margin: 22px 22px 0;
    background: var(--cartao);
    border: 1px solid var(--linha);
    border-radius: 16px;
    padding: 24px 26px 26px;
  }
  .secao-titulo {
    font-family: Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 18px;
  }

  .seg {
    display: inline-flex;
    border: 1px solid var(--linha-forte);
    border-radius: 10px;
    padding: 4px;
    background: #f1e9d9;
    margin-bottom: 22px;
  }
  .seg-btn {
    border: none; background: none;
    padding: 9px 26px; border-radius: 7px;
    font-size: 14px; font-weight: 700; color: var(--tinta-suave);
    cursor: pointer; font-family: inherit;
  }
  .seg-btn.ativo.entrada { background: var(--entrada); color: #fff; }
  .seg-btn.ativo.saida { background: var(--saida); color: #fff; }

  .campos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 22px; }
  .campo { display: flex; flex-direction: column; gap: 8px; }
  .campo-largo { grid-column: 1 / -1; }
  .campo > span { font-size: 13px; color: var(--tinta-suave); font-weight: 600; }
  .campo input {
    border: none;
    border-bottom: 1.5px solid var(--linha-forte);
    background: transparent;
    padding: 8px 2px;
    font-size: 16px;
    font-family: inherit;
    color: var(--tinta);
    width: 100%;
  }
  .campo input::placeholder { color: #b3a892; }
  .campo input:focus { outline: none; border-bottom-color: var(--tinta); }

  .valor-wrap { display: flex; align-items: baseline; gap: 6px; border-bottom: 1.5px solid var(--linha-forte); }
  .valor-wrap:focus-within { border-bottom-color: var(--tinta); }
  .valor-wrap em {
    font-style: normal; font-family: Georgia, serif; font-weight: 700;
    color: var(--tinta-suave); font-size: 16px;
  }
  .valor-wrap input {
    border: none; padding: 8px 0;
    font-family: Georgia, serif; font-weight: 700; font-size: 20px;
  }

  .form-erro { color: var(--saida); font-size: 13px; margin-top: 16px; }

  .btn-registrar {
    margin-top: 22px; width: 100%;
    border: none; border-radius: 11px; padding: 14px;
    font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; font-family: inherit;
    letter-spacing: 0.01em;
  }
  .btn-registrar.entrada { background: var(--entrada); }
  .btn-registrar.saida { background: var(--saida); }
  .btn-registrar:hover { filter: brightness(1.06); }
  .btn-registrar:disabled { opacity: 0.6; cursor: default; filter: none; }

  /* LIVRO-CAIXA */
  .livro { margin: 30px 22px 0; }
  .livro-topo {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
  }
  .filtros { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip {
    border: 1px solid var(--linha-forte);
    background: var(--cartao);
    border-radius: 999px;
    padding: 7px 15px;
    font-size: 13px; color: var(--tinta-suave); cursor: pointer; font-family: inherit;
  }
  .chip:hover { border-color: var(--tinta-suave); }
  .chip-ativo { background: var(--tinta); color: #f4ecd9; border-color: var(--tinta); }
  .chip-icone { font-size: 15px; line-height: 1; padding: 7px 12px; }

  .linhas {
    list-style: none; margin: 0; padding: 0;
    background: var(--cartao);
    border: 1px solid var(--linha);
    border-radius: 14px;
    overflow: hidden;
  }
  .linha {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    padding: 16px 20px 16px 22px;
    border-bottom: 1px solid var(--linha);
    border-left: 3px solid transparent;
  }
  .linha:last-child { border-bottom: none; }
  .linha.entrada { border-left-color: var(--entrada); }
  .linha.saida { border-left-color: var(--saida); }
  .linha-esq { min-width: 0; flex: 1; }
  .linha-desc { font-weight: 600; font-size: 15.5px; }
  .linha-motivo { color: var(--tinta-suave); font-size: 14px; margin-top: 3px; }
  .linha-meta {
    display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
    margin-top: 8px; font-size: 12px; color: #9c9481;
  }
  .sep { color: #c7bca4; }
  .linha-valor {
    font-family: Georgia, serif; font-weight: 700; font-size: 17px;
    white-space: nowrap; font-variant-numeric: tabular-nums; padding-top: 1px;
  }
  .linha-valor.entrada { color: var(--entrada); }
  .linha-valor.saida { color: var(--saida); }

  .link-excluir {
    background: none; border: none; color: var(--saida);
    font-size: 12px; cursor: pointer; text-decoration: underline; font-family: inherit; padding: 0;
  }
  .confirmar { display: inline-flex; align-items: center; gap: 8px; color: var(--tinta); }
  .link-perigo { background: none; border: none; color: var(--saida); font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: underline; }
  .link-neutro { background: none; border: none; color: var(--tinta-suave); cursor: pointer; font-family: inherit; text-decoration: underline; }

  .vazio {
    background: var(--cartao);
    border: 1px dashed var(--linha-forte);
    border-radius: 14px;
    padding: 34px; text-align: center; color: var(--tinta-suave); font-size: 14px;
  }

  .rodape { margin: 30px 22px 0; text-align: center; font-size: 12px; color: #a79f8c; }

  /* LOGIN */
  .modal-fundo {
    position: fixed; inset: 0; background: rgba(24,21,17,0.5);
    display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50;
  }
  .modal {
    background: var(--cartao);
    border-radius: 18px; padding: 30px 28px;
    width: 100%; max-width: 370px;
    display: flex; flex-direction: column; gap: 15px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.3);
    border: 1px solid var(--linha);
  }
  .modal-marca { margin-bottom: 2px; }
  .modal-titulo { font-family: Georgia, serif; font-size: 21px; margin: 0; font-weight: 700; }
  .modal-acoes { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
  .btn-linha {
    background: none; border: none; color: var(--tinta-suave);
    font-size: 14px; cursor: pointer; font-family: inherit; text-decoration: underline;
  }
  .btn-cheio {
    background: var(--tinta); color: #f4ecd9; border: none; border-radius: 10px;
    padding: 11px 22px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
  }
  .btn-cheio:hover { background: #171512; }

  @media (max-width: 520px) {
    .campos { grid-template-columns: 1fr; }
    .topo { padding: 18px 20px; }
    .saldo-hero, .painel, .livro, .aviso, .rodape { margin-left: 16px; margin-right: 16px; }
    .resumo-rot { font-size: 11px; }
    .resumo-val { font-size: 15px; }
  }
`;
