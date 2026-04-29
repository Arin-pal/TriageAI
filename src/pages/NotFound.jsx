import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page-enter" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', gap:16, padding:24, textAlign:'center' }}>
      <h1 style={{ fontSize:'5rem', fontFamily:'var(--font-heading)', fontWeight:800, color:'var(--color-brand-light)' }}>404</h1>
      <p style={{ color:'var(--color-text-muted)', fontSize:'1rem' }}>Page not found.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop:8 }}>Go Home</Link>
    </main>
  )
}
