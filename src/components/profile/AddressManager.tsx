'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().min(5, 'Postal code must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressManagerProps {
  addresses: Address[];
}

export default function AddressManager({ addresses }: AddressManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false,
    },
  });

  const startEditing = (address: Address) => {
    setCurrentAddressId(address.id);
    reset({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setCurrentAddressId(null);
    reset();
    setIsEditing(false);
  };

  const onSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const url = isEditing
        ? `/api/user/addresses/${currentAddressId}`
        : '/api/user/addresses';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      setSuccess(
        isEditing ? 'Address updated successfully' : 'Address added successfully'
      );
      setIsLoading(false);
      reset();
      setIsEditing(false);
      setCurrentAddressId(null);
      router.refresh();
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      setSuccess('Address deleted successfully');
      setIsLoading(false);
      router.refresh();
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Your Addresses</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Address Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
              placeholder="Home, Work, etc."
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message || 'Name is required'}</p>}
          </div>

          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              id="street"
              type="text"
              {...register('street')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street.message || 'Street is required'}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message || 'City is required'}</p>}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State / Province
              </label>
              <input
                id="state"
                type="text"
                {...register('state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message || 'State is required'}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                {...register('postalCode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">{errors.postalCode.message || 'Postal code is required'}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                id="country"
                type="text"
                {...register('country')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country.message || 'Country is required'}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="isDefault"
              type="checkbox"
              {...register('isDefault')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Set as default address
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? isEditing
                  ? 'Updating...'
                  : 'Adding...'
                : isEditing
                ? 'Update Address'
                : 'Add Address'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isLoading}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Saved Addresses</h3>
        <div data-testid="addresses-list">
          {addresses.length === 0 ? (
            <p className="text-gray-500">You don't have any saved addresses yet.</p>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border border-gray-200 rounded-md p-4 relative ${address.isDefault ? 'default-address' : ''}`}
                  data-testid="address-card"
                >
                  {address.isDefault && (
                    <span className="absolute top-2 right-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                  <div className="mb-2">
                    <h4 className="font-medium">{address.name}</h4>
                  </div>
                  <p className="text-gray-600">
                    {address.street}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                  <div className="mt-3 flex space-x-3">
                    <button
                      onClick={() => startEditing(address)}
                      className="text-sm text-primary-600 hover:text-primary-500"
                      data-testid="edit-address-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAddress(address.id)}
                      className="text-sm text-red-600 hover:text-red-500"
                      data-testid="delete-address-button"
                    >
                      Delete
                    </button>
                    {!address.isDefault && (
                      <button
                        onClick={() => {
                          // Set as default logic
                          const formData = {
                            ...address,
                            isDefault: true
                          };
                          setCurrentAddressId(address.id);
                          onSubmit(formData as AddressFormValues);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-500"
                        data-testid="set-default-button"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation dialog for delete */}
      <div id="delete-confirmation-dialog" className="hidden">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this address?</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  document.getElementById('delete-confirmation-dialog')?.classList.add('hidden');
                }}
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete-button"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => {
                  if (currentAddressId) {
                    deleteAddress(currentAddressId);
                  }
                  document.getElementById('delete-confirmation-dialog')?.classList.add('hidden');
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
