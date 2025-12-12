'use client'

interface SidebarToggleProps {
  onToggle: () => void
}

export default function SidebarToggle({ onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 997,
        width: 52,
        height: 52,
        borderRadius: 16,
        border: 'none',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        color: 'white',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
        e.currentTarget.style.boxShadow = '0 6px 30px rgba(102, 126, 234, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)'
      }}
    >
      ☰
    </button>
  )
}
