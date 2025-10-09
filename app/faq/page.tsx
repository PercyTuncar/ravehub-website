import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | Ravehub",
  description: "Encuentra respuestas a las preguntas más comunes sobre Ravehub, eventos, entradas y más.",
}

export default function FAQPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader title="Preguntas Frecuentes" description="Encuentra respuestas a las preguntas más comunes" />

      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Entradas y Eventos</h2>
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="item-1">
            <AccordionTrigger>¿Cómo compro entradas para un evento?</AccordionTrigger>
            <AccordionContent>
              <p>
                Para comprar entradas, navega a la sección de eventos, selecciona el evento que te interesa y haz clic
                en "Comprar entradas". Sigue las instrucciones para completar tu compra. Puedes pagar con tarjeta de
                crédito/débito o elegir la opción de pago en cuotas para eventos seleccionados.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>¿Puedo obtener un reembolso si no puedo asistir al evento?</AccordionTrigger>
            <AccordionContent>
              <p>
                No, todas las ventas de entradas son finales y no reembolsables. Te recomendamos estar seguro de tu
                disponibilidad antes de realizar la compra. Para más detalles, consulta nuestra{" "}
                <Link href="/reembolsos" className="text-primary hover:underline">
                  Política de Reembolsos
                </Link>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>¿Cómo funciona el pago en cuotas?</AccordionTrigger>
            <AccordionContent>
              <p>
                El pago en cuotas te permite dividir el costo total de la entrada en varios pagos. Es importante tener
                en cuenta:
              </p>
              <ul className="list-disc pl-5 mt-2">
                <li>Debes pagar todas las cuotas según el calendario establecido.</li>
                <li>El retraso en los pagos puede resultar en un incremento del precio.</li>
                <li>La entrada no se entregará hasta completar el pago total.</li>
                <li>No hay reembolsos por pagos parciales si no completas todas las cuotas.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>¿Cuándo recibiré mis entradas?</AccordionTrigger>
            <AccordionContent>
              <p>
                Las entradas se entregan digitalmente unos días antes del evento. Recibirás un correo electrónico con
                tus entradas o instrucciones para acceder a ellas a través de tu cuenta de Ravehub. Asegúrate de
                mantener actualizada tu información de contacto.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>¿Puedo transferir mi entrada a otra persona?</AccordionTrigger>
            <AccordionContent>
              <p>
                Las entradas generalmente no son transferibles, a menos que se indique explícitamente lo contrario. Esto
                es para prevenir la reventa no autorizada y garantizar la seguridad de nuestros eventos.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="text-2xl font-bold mb-6">Cuenta y Perfil</h2>
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="item-6">
            <AccordionTrigger>¿Cómo creo una cuenta en Ravehub?</AccordionTrigger>
            <AccordionContent>
              <p>
                Puedes crear una cuenta haciendo clic en "Registro" en la parte superior de la página. Necesitarás
                proporcionar tu nombre, dirección de correo electrónico y crear una contraseña. También puedes
                registrarte usando tu cuenta de Google para mayor comodidad.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>¿Cómo actualizo mi información personal?</AccordionTrigger>
            <AccordionContent>
              <p>
                Puedes actualizar tu información personal accediendo a tu perfil. Haz clic en tu nombre de usuario en la
                parte superior de la página y selecciona "Ajustes". Allí podrás modificar tus datos personales, cambiar
                tu contraseña y gestionar tus preferencias.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>¿Qué hago si olvidé mi contraseña?</AccordionTrigger>
            <AccordionContent>
              <p>
                Si olvidaste tu contraseña, haz clic en "Iniciar sesión" y luego en "¿Olvidaste tu contraseña?". Ingresa
                tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="text-2xl font-bold mb-6">Sorteos y Promociones</h2>
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="item-9">
            <AccordionTrigger>¿Cómo funcionan los sorteos de Ravehub?</AccordionTrigger>
            <AccordionContent>
              <p>Nuestros sorteos se realizan de manera transparente:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Anunciamos los sorteos en nuestras redes sociales oficiales.</li>
                <li>
                  Publicamos un comentario fijado en la publicación original con el enlace a la transmisión en vivo
                  donde se realizará el sorteo.
                </li>
                <li>Cualquier persona puede acceder a la transmisión para verificar la transparencia del proceso.</li>
                <li>Contactamos a los ganadores a través de los medios proporcionados durante su participación.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger>¿Necesito comprar algo para participar en los sorteos?</AccordionTrigger>
            <AccordionContent>
              <p>
                No, la participación en nuestros sorteos es completamente gratuita y no requiere ninguna compra. Las
                reglas específicas de cada sorteo se detallarán en la publicación correspondiente.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="text-2xl font-bold mb-6">Tienda y Productos</h2>
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem value="item-11">
            <AccordionTrigger>¿Cuál es la política de devoluciones para productos de la tienda?</AccordionTrigger>
            <AccordionContent>
              <p>Para productos físicos de nuestra tienda:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>
                  Aceptamos devoluciones dentro de los 14 días posteriores a la recepción si el producto está defectuoso
                  o dañado.
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
              <p className="mt-2">
                Para más detalles, consulta nuestra{" "}
                <Link href="/reembolsos" className="text-primary hover:underline">
                  Política de Reembolsos
                </Link>
                .
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-12">
            <AccordionTrigger>¿Cuánto tiempo tarda en llegar mi pedido?</AccordionTrigger>
            <AccordionContent>
              <p>
                Los tiempos de entrega varían según tu ubicación y el tipo de producto. Generalmente, los pedidos se
                procesan en 1-2 días hábiles y la entrega puede tomar entre 3-10 días hábiles adicionales. Recibirás un
                correo electrónico con la información de seguimiento cuando tu pedido sea enviado.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <h2 className="text-2xl font-bold mb-6">Contacto y Soporte</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-13">
            <AccordionTrigger>¿Cómo puedo contactar al soporte de Ravehub?</AccordionTrigger>
            <AccordionContent>
              <p>Puedes contactarnos a través de:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Email: info@ravehublatam.com</li>
                <li>
                  Formulario de contacto:{" "}
                  <Link href="/contacto" className="text-primary hover:underline">
                    Contacto
                  </Link>
                </li>
                <li>
                  Grupos de WhatsApp:{" "}
                  <a
                    href="https://linktr.ee/Grupo__WhatsApp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Acceder a los grupos
                  </a>
                </li>
              </ul>
              <p className="mt-2">
                Nuestro equipo de soporte está disponible de lunes a viernes de 9:00 a 18:00 horas.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-14">
            <AccordionTrigger>¿Dónde puedo encontrar más información sobre Ravehub?</AccordionTrigger>
            <AccordionContent>
              <p>Puedes encontrar más información sobre Ravehub en:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>
                  <Link href="/ayuda" className="text-primary hover:underline">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/terminos" className="text-primary hover:underline">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="text-primary hover:underline">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  Nuestras redes sociales:{" "}
                  <a
                    href="https://www.facebook.com/ravehub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Facebook
                  </a>
                  ,{" "}
                  <a
                    href="https://www.instagram.com/ravehub.pe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Instagram
                  </a>
                  ,{" "}
                  <a
                    href="https://www.tiktok.com/@ravehub.pe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    TikTok
                  </a>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
