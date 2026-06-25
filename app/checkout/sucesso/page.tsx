import Link from "next/link";

export default function SucessoPage() {
  return (
    <main className="status-page">
      <section className="status-card">
        <p className="eyebrow">Pedido confirmado</p>
        <h1>Pagamento recebido com sucesso.</h1>
        <p>
          Obrigado pela compra. Em uma loja real, aqui você pode buscar os dados da sessão no Stripe,
          salvar o pedido em um banco de dados e enviar um e-mail para a cliente.
        </p>
        <Link className="button primary" href="/">
          Voltar para a loja
        </Link>
      </section>
    </main>
  );
}
