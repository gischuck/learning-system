import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', type = 'confirm' }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700',
          icon: '⚠️'
        };
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700',
          icon: '✅'
        };
      case 'warning':
        return {
          confirm: 'bg-orange-600 hover:bg-orange-700',
          icon: '🔶'
        };
      default:
        return {
          confirm: 'bg-indigo-600 hover:bg-indigo-700',
          icon: '💡'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 whitespace-pre-wrap">{message}</p>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${styles.confirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;