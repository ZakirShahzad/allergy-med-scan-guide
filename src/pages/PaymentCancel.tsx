import { useEffect } from 'react';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  useEffect(() => {
    // Send cancel message to parent window
    if (window.opener) {
      window.opener.postMessage({ type: 'PAYMENT_CANCELLED' }, window.location.origin);
    }
    
    // Close the tab after 3 seconds
    const timer = setTimeout(() => {
      window.close();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-4">
          Your payment was cancelled. This window will close automatically.
        </p>
        <p className="text-sm text-muted-foreground">
          Closing in a few seconds...
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;