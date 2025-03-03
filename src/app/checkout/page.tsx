'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { StripePaymentWrapper } from '@/components/payment/StripePaymentForm';

type Address = {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type CheckoutFormData = {
  addressId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  saveAddress: boolean;
};

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'address' | 'payment'>('address');
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      addressId: 'new',
      saveAddress: true,
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout');
    }
  }, [status, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push('/cart');
    }
  }, [mounted, items, router]);

  // Fetch user addresses
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      fetch('/api/user/addresses')
        .then(res => res.json())
        .then(data => {
          if (data.addresses) {
            setAddresses(data.addresses);
            
            // Set default address if available
            const defaultAddress = data.addresses.find((addr: Address) => addr.isDefault);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id);
              setValue('addressId', defaultAddress.id);
            }
          }
        })
        .catch(err => console.error('Error fetching addresses:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, setValue]);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Create payment intent when moving to payment step
  const createPaymentIntent = async (data: CheckoutFormData) => {
    if (!isAuthenticated) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.discountPrice || item.price,
          })),
          addressId: data.addressId !== 'new' ? data.addressId : null,
          address: data.addressId === 'new' ? {
            name: data.name,
            street: data.street,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country,
            saveAddress: data.saveAddress,
          } : null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
      setPaymentStep('payment');
      
    } catch (error) {
      console.error('Payment intent creation error:', error);
      alert('There was an error setting up the payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    
    if (addressId !== 'new') {
      const selectedAddress = addresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        setValue('name', selectedAddress.name);
        setValue('street', selectedAddress.street);
        setValue('city', selectedAddress.city);
        setValue('state', selectedAddress.state);
        setValue('postalCode', selectedAddress.postalCode);
        setValue('country', selectedAddress.country);
      }
    } else {
      // Clear form when "new address" is selected
      setValue('name', '');
      setValue('street', '');
      setValue('city', '');
      setValue('state', '');
      setValue('postalCode', '');
      setValue('country', '');
    }
  };

  // Handle address form submission
  const onSubmit = async (data: CheckoutFormData) => {
    // Validate form data
    if (selectedAddressId === 'new') {
      if (!data.name || !data.street || !data.city || !data.state || !data.postalCode || !data.country) {
        return;
      }
    }
    
    // Create payment intent
    await createPaymentIntent(data);
  };

  if (!mounted || status === 'loading' || !isAuthenticated) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {paymentStep === 'address' ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                  {addresses.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-gray-700 mb-2">Select Address</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={selectedAddressId}
                        {...register('addressId')}
                        onChange={handleAddressChange}
                        data-testid="address-select"
                      >
                        <option value="new">Use a new address</option>
                        {addresses.map(address => (
                          <option key={address.id} value={address.id}>
                            {address.name} - {address.street}, {address.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {selectedAddressId === 'new' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                          {...register('name', { required: 'Name is required' })}
                          data-testid="name-input"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          className={`w-full p-2 border rounded-md ${errors.street ? 'border-red-500' : 'border-gray-300'}`}
                          {...register('street', { required: 'Street address is required' })}
                          data-testid="street-input"
                        />
                        {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            className={`w-full p-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                            {...register('city', { required: 'City is required' })}
                            data-testid="city-input"
                          />
                          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 mb-2">State/Province</label>
                          <input
                            type="text"
                            className={`w-full p-2 border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                            {...register('state', { required: 'State is required' })}
                            data-testid="state-input"
                          />
                          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Postal Code</label>
                          <input
                            type="text"
                            className={`w-full p-2 border rounded-md ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                            {...register('postalCode', { required: 'Postal code is required' })}
                            data-testid="postal-code-input"
                          />
                          {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 mb-2">Country</label>
                          <input
                            type="text"
                            className={`w-full p-2 border rounded-md ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                            {...register('country', { required: 'Country is required' })}
                            data-testid="country-input"
                          />
                          {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            {...register('saveAddress')}
                          />
                          <span className="text-gray-700">Save this address for future orders</span>
                        </label>
                      </div>
                    </>
                  )}
                  
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full bg-primary-600 text-white py-3 rounded-md font-medium hover:bg-primary-700 transition-colors ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      data-testid="continue-button"
                    >
                      {isSubmitting ? 'Processing...' : 'Continue to Payment'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Payment</h2>
                
                <div className="mb-4">
                  <button
                    onClick={() => setPaymentStep('address')}
                    className="text-primary-600 hover:text-primary-700 flex items-center mb-4"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to Shipping
                  </button>
                </div>
                
                {clientSecret && (
                  <StripePaymentWrapper
                    clientSecret={clientSecret}
                    returnUrl={`${window.location.origin}/checkout/success`}
                  />
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="mb-4">
              {items.map(item => (
                <div key={item.id} className="flex py-2 border-b border-gray-100">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <p className="text-sm font-medium">{item.title}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-gray-600">
                        ${(item.discountPrice || item.price).toFixed(2)} x {item.quantity}
                      </span>
                      <span className="text-sm font-medium">
                        ${((item.discountPrice || item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Free</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Link
              href="/cart"
              className="text-primary-600 hover:text-primary-700 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
