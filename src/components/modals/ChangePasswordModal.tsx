import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { changePassword } from '../../lib/api/workersApi';
import { isPasswordValid, calculatePasswordStrength, getPasswordStrengthInfo } from '../../lib/utils';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
}

export default function ChangePasswordModal({ 
  isOpen, 
  onClose,
  isFirstLogin = false
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Calculate password strength when newPassword changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword));
  }, [newPassword]);
  
  const strengthInfo = getPasswordStrengthInfo(passwordStrength);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!isFirstLogin && !oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordCheck = isPasswordValid(newPassword);
      if (!passwordCheck.valid) {
        newErrors.newPassword = passwordCheck.message;
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await changePassword(oldPassword, newPassword);
      if (success) {
        resetForm();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };
  
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={isFirstLogin ? () => {} : onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {!isFirstLogin && (
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                )}
                
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {isFirstLogin ? 'Change Your Password' : 'Update Password'}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {isFirstLogin 
                          ? 'You must change your password before continuing.' 
                          : 'Please enter your current password and a new password.'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
                  <div className="space-y-4">
                    {!isFirstLogin && (
                      <div>
                        <label htmlFor="old-password" className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="old-password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                            errors.oldPassword ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.oldPassword && (
                          <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.newPassword ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                      )}
                      
                      {/* Password strength indicator */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Password strength:</span>
                            <span className="text-xs font-medium">{strengthInfo.label}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${strengthInfo.color} h-2 rounded-full`} 
                              style={{ width: `${passwordStrength}%` }}
                            ></div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Password must be at least 8 characters with one uppercase letter and one number.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.confirmPassword ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                    {!isFirstLogin && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}