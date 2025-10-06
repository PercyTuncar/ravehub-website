import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Centro de Ayuda | RaveHub",
  description: "Encuentra respuestas a tus preguntas y soluciones a problemas comunes en nuestro centro de ayuda.",
}

export default function HelpCenterPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader title="Centro de Ayuda" description="Encuentra respuestas a tus preguntas más frecuentes" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Compra de Entradas</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/ayuda#compra" className="text-primary hover:underline">
                ¿Cómo comprar entradas?
              </Link>
            </li>
            <li>
              <Link href="/ayuda#pago-cuotas" className="text-primary hover:underline">
                Pago en cuotas
              </Link>
            </li>
            <li>
              <Link href="/reembolsos" className="text-primary hover:underline">
                Política de reembolsos
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Cuenta y Perfil</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/ayuda#cuenta" className="text-primary hover:underline">
                Gestión de cuenta
              </Link>
            </li>
            <li>
              <Link href="/ayuda#perfil" className="text-primary hover:underline">
                Actualizar perfil
              </Link>
            </li>
            <li>
              <Link href="/ayuda#seguridad" className="text-primary hover:underline">
                Seguridad de la cuenta
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Eventos</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/ayuda#eventos" className="text-primary hover:underline">
                Información de eventos
              </Link>
            </li>
            <li>
              <Link href="/ayuda#entradas" className="text-primary hover:underline">
                Entradas y accesos
              </Link>
            </li>
            <li>
              <Link href="/ayuda#sorteos" className="text-primary hover:underline">
                Sorteos y promociones
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Tienda</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/ayuda#productos" className="text-primary hover:underline">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/ayuda#envios" className="text-primary hover:underline">
                Envíos
              </Link>
            </li>
            <li>
              <Link href="/ayuda#devoluciones" className="text-primary hover:underline">
                Devoluciones
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Documentos Legales</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/terminos" className="text-primary hover:underline">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="text-primary hover:underline">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/reembolsos" className="text-primary hover:underline">
                Política de reembolsos
              </Link>
            </li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Contacto</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/contacto" className="text-primary hover:underline">
                Formulario de contacto
              </Link>
            </li>
            <li>
              <a href="mailto:info@weareravehub.com" className="text-primary hover:underline">
                Email: info@weareravehub.com
              </a>
            </li>
            <li>
              <a
                href="https://linktr.ee/Grupo__WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Grupos de WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6" id="compra">
          ¿Cómo comprar entradas?
        </h2>
        <div className="prose max-w-none">
          <p>Comprar entradas en RaveHub es un proceso sencillo y seguro. Sigue estos pasos:</p>
          <ol>
            <li>Selecciona el evento al que deseas asistir desde nuestra sección de eventos.</li>
            <li>Elige el tipo de entrada y la cantidad que deseas comprar.</li>
            <li>Selecciona tu método de pago preferido: pago completo o pago en cuotas.</li>
            <li>Completa la información requerida y confirma tu compra.</li>
            <li>Recibirás un correo electrónico con la confirmación de tu compra.</li>
          </ol>
          <p>
            Las entradas se entregarán digitalmente unos días antes del evento. Asegúrate de mantener actualizada tu
            información de contacto para recibir todas las notificaciones importantes.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-6 mt-12" id="pago-cuotas">
          Pago en cuotas
        </h2>
        <div className="prose max-w-none">
          <p>
            RaveHub ofrece la posibilidad de pagar tus entradas en cuotas para facilitar tu asistencia a nuestros
            eventos. Es importante tener en cuenta:
          </p>
          <ul>
            <li>Las cuotas deben pagarse puntualmente según el calendario establecido al momento de la compra.</li>
            <li>El incumplimiento en el pago de una cuota puede resultar en un incremento del precio de la entrada.</li>
            <li>La entrada no será entregada hasta que se complete el pago total de todas las cuotas.</li>
            <li>Es responsabilidad del cliente cumplir con los pagos acordados.</li>
          </ul>
          <p>
            Te recomendamos configurar recordatorios para tus fechas de pago y mantener fondos suficientes en tu método
            de pago preferido.
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-6 mt-12" id="sorteos">
          Sorteos y promociones
        </h2>
        <div className="prose max-w-none">
          <p>En RaveHub realizamos sorteos y promociones de manera transparente:</p>
          <ul>
            <li>Todos los sorteos se anuncian en nuestras redes sociales oficiales.</li>
            <li>
              Para cada sorteo, publicaremos un comentario fijado en la publicación original con el enlace a la
              transmisión en vivo donde se realizará el sorteo.
            </li>
            <li>Cualquier persona puede acceder a la transmisión para verificar la transparencia del proceso.</li>
            <li>Los ganadores serán contactados a través de los medios proporcionados durante su participación.</li>
          </ul>
          <p>
            Participar en nuestros sorteos es completamente gratuito y no afecta tus posibilidades de ganar en futuros
            sorteos.
          </p>
        </div>
      </div>
    </div>
  )
}
