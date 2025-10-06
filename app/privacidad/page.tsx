import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Política de Privacidad | RaveHub",
  description: "Información sobre cómo RaveHub recopila, utiliza y protege tus datos personales.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader title="Política de Privacidad" description="Última actualización: 21 de mayo de 2025" />

      <div className="prose max-w-none mt-12">
        <h2>1. Introducción</h2>
        <p>
          En RaveHub, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política de
          Privacidad describe cómo recopilamos, utilizamos y compartimos tu información cuando utilizas nuestra
          plataforma.
        </p>
        <p>
          Al utilizar RaveHub, aceptas las prácticas descritas en esta política. Te recomendamos leerla detenidamente
          para entender cómo tratamos tu información.
        </p>

        <h2>2. Información que Recopilamos</h2>
        <p>Podemos recopilar los siguientes tipos de información:</p>
        <ul>
          <li>
            <strong>Información de registro:</strong> Nombre, dirección de correo electrónico, contraseña, fecha de
            nacimiento.
          </li>
          <li>
            <strong>Información de perfil:</strong> Foto de perfil, preferencias musicales, ubicación.
          </li>
          <li>
            <strong>Información de pago:</strong> Detalles de tarjetas de crédito/débito, información de facturación.
          </li>
          <li>
            <strong>Información de uso:</strong> Cómo interactúas con nuestra plataforma, eventos a los que asistes,
            compras realizadas.
          </li>
          <li>
            <strong>Información del dispositivo:</strong> Tipo de dispositivo, sistema operativo, dirección IP.
          </li>
        </ul>

        <h2>3. Cómo Utilizamos tu Información</h2>
        <p>Utilizamos tu información para:</p>
        <ul>
          <li>Proporcionar, mantener y mejorar nuestra plataforma.</li>
          <li>Procesar transacciones y enviar confirmaciones de compra.</li>
          <li>Personalizar tu experiencia y ofrecerte contenido relevante.</li>
          <li>Comunicarnos contigo sobre eventos, promociones y actualizaciones.</li>
          <li>Detectar, investigar y prevenir actividades fraudulentas o no autorizadas.</li>
          <li>Cumplir con obligaciones legales y resolver disputas.</li>
        </ul>

        <h2>4. Compartir tu Información</h2>
        <p>Podemos compartir tu información con:</p>
        <ul>
          <li>
            <strong>Organizadores de eventos:</strong> Para facilitar tu entrada y participación en eventos.
          </li>
          <li>
            <strong>Proveedores de servicios:</strong> Que nos ayudan a operar nuestra plataforma (procesamiento de
            pagos, análisis de datos, servicio al cliente).
          </li>
          <li>
            <strong>Socios comerciales:</strong> Para ofrecerte promociones conjuntas o servicios complementarios.
          </li>
          <li>
            <strong>Autoridades legales:</strong> Cuando sea requerido por ley o para proteger nuestros derechos.
          </li>
        </ul>
        <p>No vendemos tu información personal a terceros.</p>

        <h2>5. Seguridad de Datos</h2>
        <p>
          Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no
          autorizado, pérdida o alteración. Sin embargo, ninguna transmisión por Internet o almacenamiento electrónico
          es 100% seguro, por lo que no podemos garantizar su seguridad absoluta.
        </p>

        <h2>6. Tus Derechos</h2>
        <p>Dependiendo de tu ubicación, puedes tener los siguientes derechos:</p>
        <ul>
          <li>Acceder a tu información personal.</li>
          <li>Corregir información inexacta.</li>
          <li>Eliminar tu información en ciertas circunstancias.</li>
          <li>Restringir u oponerte al procesamiento de tu información.</li>
          <li>Solicitar la portabilidad de tus datos.</li>
          <li>Retirar tu consentimiento en cualquier momento.</li>
        </ul>
        <p>Para ejercer estos derechos, contáctanos a través de info@weareravehub.com.</p>

        <h2>7. Cookies y Tecnologías Similares</h2>
        <p>
          Utilizamos cookies y tecnologías similares para mejorar tu experiencia, recordar tus preferencias y analizar
          cómo utilizas nuestra plataforma. Puedes gestionar tus preferencias de cookies a través de la configuración de
          tu navegador.
        </p>

        <h2>8. Transferencias Internacionales de Datos</h2>
        <p>
          Tu información puede ser transferida y procesada en países distintos al tuyo, donde nuestros servidores están
          ubicados. Estos países pueden tener leyes de protección de datos diferentes. Al utilizar nuestra plataforma,
          aceptas estas transferencias.
        </p>

        <h2>9. Retención de Datos</h2>
        <p>
          Conservamos tu información durante el tiempo necesario para cumplir con los fines descritos en esta política,
          a menos que se requiera o permita un período de retención más largo por ley.
        </p>

        <h2>10. Cambios a esta Política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos cualquier cambio significativo
          mediante un aviso en nuestra plataforma o por correo electrónico. Te recomendamos revisar esta política
          regularmente.
        </p>

        <h2>11. Contacto</h2>
        <p>
          Si tienes preguntas o inquietudes sobre esta Política de Privacidad o nuestras prácticas de datos, contáctanos
          a:
        </p>
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
