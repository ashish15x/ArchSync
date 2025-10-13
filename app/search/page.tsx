export default function SearchPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Search</h1>
        <p className="text-gray-400 mb-8">
          Search through your architecture documentation
        </p>
        
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-gray-700 transition-colors"
          />
        </div>

        <div className="text-gray-500 text-center py-12">
          Enter a search query to find relevant documentation
        </div>
      </div>
    </div>
  );
}
