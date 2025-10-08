import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Política de Reembolsos | Ravehub",
  description: "Información sobre la política de reembolsos de Ravehub para entradas de eventos y productos.",
}

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader title="Política de Reembolsos" description="Última actualización: 21 de mayo de 2025" />

      <div className="prose max-w-none mt-12">
        <h2>1. Política General de No Reembolso</h2>
        <p>
          En Ravehub, todas las ventas de entradas para eventos son <strong>finales y no reembolsables</strong>. Al
          realizar una compra, usted acepta esta política de no reembolso. Esta política está diseñada para garantizar
          la viabilidad financiera de los eventos y proporcionar certeza a los organizadores.
        </p>

        <h2>2. Entradas para Eventos</h2>
        <p>Para todas las entradas de eventos adquiridas a través de Ravehub:</p>
        <ul>
          <li>
            No se ofrecen reembolsos por cambio de opinión, conflictos de horario, o cualquier otra razón personal.
          </li>
          <li>
            No se ofrecen reembolsos si no puede asistir al evento por cualquier motivo, incluyendo enfermedad o
            emergencias personales.
          </li>
          <li>Las entradas no son transferibles a menos que se indique explícitamente lo contrario.</li>
          <li>
            No se ofrecen reembolsos por pagos parciales realizados en el sistema de pago en cuotas si no se completa el
            pago total.
          </li>
        </ul>

        <h2>3. Pago en Cuotas</h2>
        <p>Para entradas adquiridas mediante nuestro sistema de pago en cuotas:</p>
        <ul>
          <li>Usted se compromete a pagar todas las cuotas según el calendario establecido al momento de la compra.</li>
          <li>El incumplimiento en el pago de una cuota puede resultar en un incremento del precio de la entrada.</li>
          <li>
            Si no se completa el pago total de todas las cuotas, no se entregará la entrada y no se realizará ningún
            reembolso por los pagos parciales realizados.
          </li>
          <li>Es responsabilidad del cliente cumplir con los pagos acordados en las fechas establecidas.</li>
        </ul>

        <h2>4. Cancelación o Reprogramación de Eventos</h2>
        <p>En el caso excepcional de que un evento sea cancelado por el organizador y no sea reprogramado:</p>
        <ul>
          <li>
            Ravehub podrá, a su discreción, ofrecer un reembolso del valor nominal de la entrada (excluyendo tarifas de
            servicio y gastos de envío).
          </li>
          <li>Alternativamente, Ravehub podrá ofrecer crédito para futuros eventos en lugar de un reembolso.</li>
        </ul>
        <p>Si un evento es reprogramado:</p>
        <ul>
          <li>Las entradas generalmente serán válidas para la nueva fecha.</li>
          <li>No se ofrecerán reembolsos automáticos por eventos reprogramados.</li>
          <li>
            En circunstancias excepcionales, Ravehub podrá, a su discreción, considerar solicitudes de reembolso caso
            por caso.
          </li>
        </ul>

        <h2>5. Productos de la Tienda</h2>
        <p>Para productos físicos adquiridos en nuestra tienda online:</p>
        <ul>
          <li>
            Se aceptarán devoluciones dentro de los 14 días posteriores a la recepción si el producto está defectuoso o
            dañado.
          </li>
          <li>
            Los productos deben ser devueltos en su embalaje original y en las mismas condiciones en que fueron
            recibidos.
          </li>
          <li>
            Los gastos de envío para devoluciones corren por cuenta del cliente, a menos que el producto esté
            defectuoso.
          </li>
        </ul>

        <h2>6. Excepciones</h2>
        <p>
          Ravehub se reserva el derecho de hacer excepciones a esta política caso por caso, a su sola discreción. Sin
          embargo, estas excepciones no establecen un precedente ni modifican esta política general.
        </p>

        <h2>7. Proceso de Solicitud</h2>
        <p>Si cree que su situación califica para una excepción a nuestra política de no reembolso:</p>
        <ol>
          <li>
            Contacte a nuestro equipo de soporte a través de info@weareravehub.com dentro de los 7 días posteriores a la
            compra o al anuncio de cancelación/reprogramación del evento.
          </li>
          <li>Incluya su número de pedido, detalles de la compra y una explicación detallada de su solicitud.</li>
          <li>Nuestro equipo revisará su solicitud y responderá dentro de los 10 días hábiles.</li>
        </ol>

        <h2>8. Disputas y Reclamaciones</h2>
        <p>
          Si tiene alguna disputa relacionada con esta política de reembolsos, acepta primero intentar resolver el
          problema directamente con Ravehub antes de buscar resolución a través de otros medios.
        </p>

        <h2>9. Modificaciones a la Política</h2>
        <p>
          Ravehub se reserva el derecho de modificar esta política de reembolsos en cualquier momento. Las
          modificaciones entrarán en vigor inmediatamente después de su publicación en nuestra plataforma y se aplicarán
          a todas las compras realizadas después de la fecha de modificación.
        </p>

        <h2>10. Contacto</h2>
        <p>Si tiene alguna pregunta sobre nuestra política de reembolsos, por favor contáctenos a:</p>
        <ul>
          <li>Email: info@weareravehub.com</li>
          <li>
            Formulario de contacto:{" "}
            <a href="/contacto" className="text-primary hover:underline">
              Contacto
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
