import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-3xl font-bold text-gray-900">Page non trouvée</h2>
        <p className="text-gray-600 text-lg max-w-md">
          Désolé, la page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
