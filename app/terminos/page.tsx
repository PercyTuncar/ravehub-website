import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Términos y Condiciones | Ravehub",
  description:
    "Términos y condiciones legales para el uso de la plataforma Ravehub y la compra de entradas para eventos.",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader title="Términos y Condiciones" description="Última actualización: 21 de mayo de 2025" />

      <div className="prose max-w-none mt-12">
        <h2>1. Introducción</h2>
        <p>
          Bienvenido a Ravehub. Estos Términos y Condiciones rigen el uso de nuestra plataforma, incluyendo nuestro
          sitio web, aplicaciones móviles, servicios y funcionalidades ofrecidas por Ravehub (colectivamente, la
          "Plataforma").
        </p>
        <p>
          Al acceder o utilizar nuestra Plataforma, usted acepta estar sujeto a estos Términos y Condiciones. Si no está
          de acuerdo con alguna parte de estos términos, no podrá acceder a la Plataforma.
        </p>

        <h2>2. Uso de la Plataforma</h2>
        <p>
          Ravehub proporciona una plataforma para descubrir, comprar entradas y participar en eventos de música
          electrónica en Latinoamérica. Usted acepta utilizar la Plataforma solo para fines legales y de manera que no
          infrinja los derechos de terceros ni restrinja el uso de la Plataforma por parte de otros.
        </p>

        <h2>3. Cuentas de Usuario</h2>
        <p>
          Para acceder a ciertas funciones de la Plataforma, deberá crear una cuenta. Usted es responsable de mantener
          la confidencialidad de su cuenta y contraseña, y acepta la responsabilidad de todas las actividades que
          ocurran bajo su cuenta.
        </p>

        <h2>4. Compra de Entradas</h2>
        <p>Al comprar entradas a través de nuestra Plataforma, usted acepta los siguientes términos:</p>
        <ul>
          <li>La información proporcionada durante el proceso de compra debe ser precisa y completa.</li>
          <li>Las entradas no son transferibles a menos que se indique explícitamente lo contrario.</li>
          <li>Ravehub se reserva el derecho de cancelar compras que parezcan fraudulentas o violen estos términos.</li>
          <li>Las entradas se entregarán digitalmente unos días antes del evento.</li>
        </ul>

        <h2>5. Pago en Cuotas</h2>
        <p>Para entradas con opción de pago en cuotas:</p>
        <ul>
          <li>Usted se compromete a pagar todas las cuotas según el calendario establecido al momento de la compra.</li>
          <li>El incumplimiento en el pago de una cuota puede resultar en un incremento del precio de la entrada.</li>
          <li>La entrada no será entregada hasta que se complete el pago total de todas las cuotas.</li>
          <li>No se realizarán reembolsos por pagos parciales si no se completa el pago total.</li>
        </ul>

        <h2>6. Política de Reembolsos</h2>
        <p>
          Ravehub no ofrece reembolsos para entradas compradas, excepto en circunstancias específicas detalladas en
          nuestra{" "}
          <a href="/reembolsos" className="text-primary hover:underline">
            Política de Reembolsos
          </a>
          . Al realizar una compra, usted reconoce y acepta esta política.
        </p>

        <h2>7. Conducta en Eventos</h2>
        <p>Al asistir a eventos organizados o promocionados por Ravehub, usted acepta:</p>
        <ul>
          <li>Cumplir con todas las reglas del lugar y las instrucciones del personal del evento.</li>
          <li>
            No participar en comportamientos que puedan poner en peligro la seguridad o el disfrute de otros asistentes.
          </li>
          <li>
            Ravehub se reserva el derecho de denegar la entrada o expulsar a cualquier persona que viole estas normas
            sin reembolso.
          </li>
        </ul>

        <h2>8. Sorteos y Promociones</h2>
        <p>Los sorteos y promociones realizados por Ravehub están sujetos a los siguientes términos:</p>
        <ul>
          <li>La participación en sorteos es gratuita y no requiere compra.</li>
          <li>
            Los sorteos se realizarán de manera transparente, con un enlace a la transmisión en vivo publicado en la
            publicación original del sorteo.
          </li>
          <li>Ravehub se reserva el derecho de modificar o cancelar cualquier sorteo o promoción sin previo aviso.</li>
          <li>Los ganadores serán notificados a través de los medios proporcionados durante su participación.</li>
        </ul>

        <h2>9. Propiedad Intelectual</h2>
        <p>
          Todo el contenido presente en la Plataforma, incluyendo pero no limitado a textos, gráficos, logotipos,
          imágenes y software, es propiedad de Ravehub o de sus proveedores de contenido y está protegido por leyes de
          propiedad intelectual.
        </p>

        <h2>10. Limitación de Responsabilidad</h2>
        <p>
          Ravehub no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluida
          la pérdida de beneficios, ya sea que se base en contrato, agravio, negligencia, responsabilidad estricta o de
          otro tipo.
        </p>

        <h2>11. Modificaciones a los Términos</h2>
        <p>
          Ravehub se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las
          modificaciones entrarán en vigor inmediatamente después de su publicación en la Plataforma. Su uso continuado
          de la Plataforma después de tales modificaciones constituirá su aceptación de los nuevos términos.
        </p>

        <h2>12. Ley Aplicable</h2>
        <p>
          Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes del país donde Ravehub tiene
          su sede principal, sin tener en cuenta sus conflictos de disposiciones legales.
        </p>

        <h2>13. Contacto</h2>
        <p>Si tiene alguna pregunta sobre estos Términos y Condiciones, por favor contáctenos a través de:</p>
        <ul>
          <li>Email: info@ravehublatam.com</li>
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
