import Link from "next/link";

export default function SucessoPage() {
  return (
    <main className="status-page">
      <section className="status-card">
        <p className="eyebrow">Pedido confirmado</p>
        <h1>A sua joia está a caminho.</h1>
        <p>
          Recebemos o seu pagamento com sucesso. Em breve você receberá a confirmação do pedido
          e os detalhes de envio no contacto informado durante a compra.
        </p>
        <Link className="button primary" href="/">
          Voltar para a loja
        </Link>
      </section>
    </main>
  );
}
