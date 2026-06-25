import Link from "next/link";

export default function CanceladoPage() {
  return (
    <main className="status-page">
      <section className="status-card">
        <p className="eyebrow">Checkout cancelado</p>
        <h1>A compra não foi finalizada.</h1>
        <p>Você pode voltar ao carrinho, revisar os produtos e tentar novamente quando quiser.</p>
        <Link className="button primary" href="/#colecao">
          Voltar para a coleção
        </Link>
      </section>
    </main>
  );
}
