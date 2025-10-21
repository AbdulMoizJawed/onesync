export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">🎵 Simple Upload Test</h1>
      <p>If you can see this, the server is working!</p>
      
      <form className="mt-4 space-y-4">
        <div>
          <label htmlFor="title">Song Title:</label>
          <input 
            id="title"
            type="text" 
            className="border p-2 ml-2"
            placeholder="Enter title" 
          />
        </div>
        
        <div>
          <label htmlFor="artist">Artist:</label>
          <input 
            id="artist"
            type="text" 
            className="border p-2 ml-2"
            placeholder="Enter artist" 
          />
        </div>
        
        <div>
          <label htmlFor="audio">Audio File:</label>
          <input 
            id="audio"
            type="file" 
            accept="audio/*"
            className="border p-2 ml-2"
          />
        </div>
        
        <div>
          <label htmlFor="image">Cover Art:</label>
          <input 
            id="image"
            type="file" 
            accept="image/*"
            className="border p-2 ml-2"
          />
        </div>
        
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Upload Files
        </button>
      </form>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Architecture:</h3>
        <ul className="mt-2">
          <li>✅ Audio + Image + CSV → AWS S3 + FTP Server</li>
          <li>✅ User data + metadata → Supabase Database</li>
          <li>✅ Clean separation of files vs data</li>
        </ul>
      </div>
    </div>
  )
}
