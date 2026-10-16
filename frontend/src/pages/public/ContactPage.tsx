import { useState } from "react";
import { Mail, Phone, MapPin, AlertCircle, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        setError("Veuillez remplir tous les champs.");
        setLoading(false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Email invalide.");
        setLoading(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">


      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {/* Contact Info Cards */}
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-red-700 text-white rounded-lg flex items-center justify-center mb-4">
                <Phone size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600">+509 4130 0944</p>
              <p className="text-sm text-gray-500 mt-2">Disponible 24h/24, 7j/7</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-red-700 text-white rounded-lg flex items-center justify-center mb-4">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">contact@kjourentacar.com</p>
              <p className="text-sm text-gray-500 mt-2">Réponse en moins de 24h</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-red-700 text-white rounded-lg flex items-center justify-center mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Adresse</h3>
              <p className="text-gray-600">Port-au-Prince, Haïti</p>
              <p className="text-sm text-gray-500 mt-2">Rue de la Commerce</p>
            </div>
          </div>

          {/* Contact Form and Map */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Envoyez-nous un message</h2>
              
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900">Message envoyé!</h3>
                    <p className="text-sm text-green-700">Nous vous répondrons bientôt.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-lg border border-gray-200">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Nom complet</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Desmarais Kendjino"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemple@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sujet</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Demande de réservation"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Votre message..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Location Map */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Nous trouver</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-full">
                {/* Address Info */}
                <div className="mb-6 flex gap-4">
                  <div className="w-12 h-12 bg-red-700 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                    <p className="text-gray-600">Cap-Haïtien</p>
                    <p className="text-gray-600">Vaudreuil</p>
                    <p className="text-gray-600">Carrefour Zabitan</p>
                  </div>
                </div>

                {/* Map */}
                <div className="rounded-lg overflow-hidden mb-6 h-64">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3824.8723480159445!2d-72.2033!3d19.8333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eb1cb3b3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sCarrefour%20Zabitan%2C%20Cap-Ha%C3%AFtien!5e0!3m2!1sfr!2sht!4v1234567890"
                  ></iframe>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Phone size={20} className="text-red-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Téléphone</p>
                      <p className="text-gray-600">+509 4130 0944</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Mail size={20} className="text-red-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <p className="text-gray-600">contact@kjourentacar.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

