export default function TestPage() {
  return (
    <div style={{ backgroundColor: 'white', color: 'black', padding: '20px' }}>
      <h1>Test Page - If you can see this, the app is working</h1>
      <p>This is a simple test page with inline styles to bypass any CSS issues.</p>
      <a href="/auth/login" style={{ color: 'blue' }}>Go to Login Page</a>
    </div>
  )
}