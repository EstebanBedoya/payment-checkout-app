import { useState } from 'react'
import { CreditCardForm } from './components/CreditCardForm/CreditCardForm'
import { DeliveryForm } from './components/DeliveryForm/DeliveryForm'
import { SummaryBackdrop } from './components/SummaryBackdrop/SummaryBackdrop'
import './App.css'

function App() {
  const [showSummary, setShowSummary] = useState(false)

  const dummyAmounts = {
    productPrice: 15000000,
    baseFee: 300000,
    deliveryFee: 500000,
    total: 15800000
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 className="display-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Component Gallery</h1>
        <p style={{ color: 'var(--text-muted)' }}>Editorial Financial Premium — Design System Preview</p>
      </header>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem', borderBottom: '1px solid var(--ghost-border)', paddingBottom: '0.5rem' }}>1. Payment & Card Detection</h2>
        <div style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: '1.5rem' }}>
          <CreditCardForm onSubmit={(data) => console.log('Card Data:', data)} />
        </div>
      </section>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem', borderBottom: '1px solid var(--ghost-border)', paddingBottom: '0.5rem' }}>2. Delivery Information</h2>
        <div style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: '1.5rem' }}>
          <DeliveryForm onSubmit={(data) => console.log('Delivery Data:', data)} />
        </div>
      </section>

      <section style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem', borderBottom: '1px solid var(--ghost-border)', paddingBottom: '0.5rem' }}>3. Summary & Backdrop</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowSummary(true)}
          style={{ maxWidth: '300px', margin: '0 auto' }}
        >
          Open Summary Backdrop
        </button>
      </section>

      {showSummary && (
        <SummaryBackdrop 
          amounts={dummyAmounts} 
          onConfirm={() => {
            alert('Payment Confirmed!');
            setShowSummary(false);
          }} 
          onBack={() => setShowSummary(false)} 
          loading={false}
        />
      )}

      <footer style={{ marginTop: '8rem', textAlign: 'center', opacity: 0.5, fontSize: '0.875rem' }}>
        Built with Antigravity • Payment Checkout App
      </footer>
    </div>
  )
}

export default App
