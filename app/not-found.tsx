export default function NaoEncontrada() {
  return (
    <div className="pagina">
      <header className="cabecalho">
        <h1>
          <span className="titulo-marca">404</span>
        </h1>
        <p className="sub">Página não encontrada</p>
      </header>
      <main>
        <p className="mensagem">
          Não tem nada aqui. A Tarja é uma página só: <a href="/">volte para o começo</a>.
        </p>
      </main>
    </div>
  );
}
