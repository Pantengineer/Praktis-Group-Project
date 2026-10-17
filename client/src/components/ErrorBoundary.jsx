import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-4 my-3">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-danger text-white py-3 px-4 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-octagon-fill fs-5"></i>
                <h6 className="mb-0 fw-bold">Terjadi Kesalahan pada Halaman Ini</h6>
              </div>
              <span className="badge bg-white text-danger fw-bold">Runtime Error</span>
            </div>
            <div className="card-body p-4">
              <p className="text-secondary mb-3">
                Terjadi kendala saat merender komponen ini. Detail kesalahan tercantum di bawah ini:
              </p>
              
              <div className="alert alert-danger font-monospace py-2 px-3 small border-0 mb-3" style={{ wordBreak: 'break-word' }}>
                <strong>Pesan Error:</strong> {this.state.error?.message || String(this.state.error)}
              </div>

              {this.state.errorInfo?.componentStack && (
                <details className="mb-3">
                  <summary className="text-muted small cursor-pointer" style={{ cursor: 'pointer' }}>
                    Lihat Stack Trace Komponen
                  </summary>
                  <pre className="bg-light p-3 rounded-3 mt-2 small text-danger font-monospace border" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="d-flex gap-2 pt-2">
                <button 
                  type="button"
                  className="btn btn-primary btn-sm rounded-3 px-3 fw-bold d-flex align-items-center gap-1"
                  onClick={() => window.location.reload()}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Muat Ulang Halaman</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-3 px-3"
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    window.location.href = '/admin/dashboard';
                  }}
                >
                  <span>Kembali ke Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
