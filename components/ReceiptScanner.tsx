'use client';

import { useState } from 'react';
import { takeReceiptPhoto, selectReceiptFromGallery, processReceiptWithAI, ReceiptPhoto } from '@/lib/camera';
import { haptics } from '@/lib/mobile';

interface ReceiptScannerProps {
  onReceiptScanned?: (data: any) => void;
}

/**
 * Receipt Scanner component
 * Takes photos of receipts and processes them with AI
 */
export function ReceiptScanner({ onReceiptScanned }: ReceiptScannerProps) {
  const [photo, setPhoto] = useState<ReceiptPhoto | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTakePhoto = async () => {
    await haptics.light();
    const photoData = await takeReceiptPhoto();

    if (photoData) {
      setPhoto(photoData);
      await processReceipt(photoData);
    }
  };

  const handleSelectFromGallery = async () => {
    await haptics.light();
    const photoData = await selectReceiptFromGallery();

    if (photoData) {
      setPhoto(photoData);
      await processReceipt(photoData);
    }
  };

  const processReceipt = async (photoData: ReceiptPhoto) => {
    setProcessing(true);

    try {
      const result = await processReceiptWithAI(photoData);

      if (result) {
        setResult(result);
        await haptics.success();

        if (onReceiptScanned) {
          onReceiptScanned(result);
        }
      } else {
        await haptics.error();
        alert('Failed to process receipt. Please try again.');
      }
    } catch (error) {
      await haptics.error();
      console.error('Receipt processing error:', error);
      alert('Failed to process receipt');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {!photo ? (
        <div className="space-y-3">
          <button
            onClick={handleTakePhoto}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-black hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Take Photo of Receipt</span>
          </button>

          <button
            onClick={handleSelectFromGallery}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Choose from Gallery</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Photo Preview */}
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={photo.webPath}
              alt="Receipt"
              className="w-full h-auto"
            />
            {processing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
                  <p className="text-white font-semibold">Processing receipt...</p>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Receipt Processed
              </h3>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Merchant:</span> {result.merchant}
                </div>
                <div>
                  <span className="font-semibold">Date:</span> {result.date}
                </div>
                <div>
                  <span className="font-semibold">Total:</span> ${result.total.toFixed(2)}
                </div>

                {result.items && result.items.length > 0 && (
                  <div>
                    <span className="font-semibold">Items:</span>
                    <ul className="mt-1 ml-4 list-disc">
                      {result.items.map((item: any, index: number) => (
                        <li key={index}>
                          {item.name} - ${item.price.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition-colors"
            >
              Scan Another
            </button>

            {result && (
              <button
                onClick={() => {
                  haptics.success();
                  // Handle save logic
                }}
                className="flex-1 px-4 py-3 bg-black hover:bg-gray-900 text-white rounded-lg font-semibold transition-colors"
              >
                Save Expense
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
