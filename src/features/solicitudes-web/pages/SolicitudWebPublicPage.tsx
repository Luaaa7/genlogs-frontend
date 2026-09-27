// src/features/solicitudes-web/pages/SolicitudWebPublicPage.tsx

import React from 'react';
import { SolicitudWebForm } from '../components/SolicitudWebForm';
import { Send, Clock, Shield, Users, Check } from 'lucide-react';

export const SolicitudWebPublicPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Hero */}
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Solicita tu Cotización
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8">
            Completa este formulario y nuestro equipo de ventas te contactará
            dentro de 24 horas con una cotización personalizada
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-12 px-4 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Fast */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Rápido
              </h3>
              <p className="text-gray-600">
                Respuesta dentro de 24 horas con una cotización personalizada
              </p>
            </div>

            {/* Secure */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-4 rounded-full">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Seguro
              </h3>
              <p className="text-gray-600">
                Tus datos están protegidos y solo serán usados para tu cotización
              </p>
            </div>

            {/* Expert */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-100 p-4 rounded-full">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Equipo Experto
              </h3>
              <p className="text-gray-600">
                Especialistas con experiencia en tu industria te asesorarán
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <SolicitudWebForm onSuccess={() => {}} />
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-gray-50 py-12 px-4 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            ¿Por qué elegir GENLOGS?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Reason 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Check className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Experiencia Comprobada
                </h3>
                <p className="text-gray-600">
                  Más de 15 años suministrando repuestos de calidad a la industria
                  minera peruana
                </p>
              </div>
            </div>

            {/* Reason 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Check className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Amplio Catálogo
                </h3>
                <p className="text-gray-600">
                  Más de 5000 productos en stock de las mejores marcas internacionales
                </p>
              </div>
            </div>

            {/* Reason 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Check className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Atención Personalizada
                </h3>
                <p className="text-gray-600">
                  Equipo dedicado que entiende tus necesidades específicas y ofrece
                  soluciones a medida
                </p>
              </div>
            </div>

            {/* Reason 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Check className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Precios Competitivos
                </h3>
                <p className="text-gray-600">
                  Ofertas especiales y programas de descuento para clientes recurrentes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para obtener tu cotización?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Completa el formulario arriba y deja que nuestro equipo se encargue
            del resto
          </p>
          <a
            href="#form"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Enviar Solicitud Ahora
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Sobre GENLOGS</h3>
              <p className="text-sm">
                Proveedor líder de repuestos industriales y suministros para la
                minería en Perú
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contacto</h3>
              <p className="text-sm mb-2">📞 +51 (1) 2345-6789</p>
              <p className="text-sm">📧 contacto@genlogs.pe</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Ubicación</h3>
              <p className="text-sm">
                Calle Principal 123<br />
                Lima, Perú
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 GENLOGS S.A.C. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
