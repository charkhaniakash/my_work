// pages/404.tsx
export default function Custom404() {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-900">
        <h1 className="text-7xl font-extrabold mb-3">404</h1>
        <p className="text-2xl mb-2">Uh-oh! Page Not Found</p>

        <a
          href="/dashboard"
          className="bg-indigo-600 text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Return Home
        </a>
      </div>
    )
  }
  