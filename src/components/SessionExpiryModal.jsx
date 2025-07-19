import AuthForm from './auth/AuthForm';
import GoogleButton from './auth/GoogleButton';

export default function SessionExpiryModal({ open, onLoginSuccess }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Session Expired</h2>
        <p className="mb-4 text-gray-700">For your security, please log in again to continue.</p>
        <AuthForm onLoginSuccess={onLoginSuccess} />
        <div className="mt-4">
          <GoogleButton onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
} 