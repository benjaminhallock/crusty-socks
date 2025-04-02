import React, { useState } from 'react';
import { createReport } from '../../services/reports';

const REPORT_REASONS = [
  'AFK / Inactive',
  'Abusive Chat',
  'Inappropriate Drawing',
  'Inappropriate Username',
  'Spamming',
  'Other'
];

const ReportModal = ({ onClose, reportedUser, currentUsername, roomId, chatLogs }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const reportData = {
        reportedUser,
        reportedBy: currentUsername,
        roomId,
        reason: selectedReason,
        additionalComments,
        chatLogs: chatLogs?.slice(-10) || [],
      };
      
      const result = await createReport(reportData);
      
      if (result.success) {
        setSuccess(true);
        // Close the modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('An error occurred while submitting your report');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl text-white font-bold mb-4">Report Player</h2>
        
        {success ? (
          <div className="bg-green-500 text-white p-4 rounded mb-4 text-center">
            Report submitted successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500 text-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-white mb-2">Reporting: <span className="font-bold">{reportedUser}</span></p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Select a reason *</label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center">
                    <input
                      type="radio"
                      id={`reason-${reason}`}
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="mr-2"
                    />
                    <label 
                      htmlFor={`reason-${reason}`}
                      className="text-white cursor-pointer"
                    >
                      {reason}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Additional comments</label>
              <textarea
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                className="w-full p-2 bg-gray-700 text-white rounded"
                rows="3"
                placeholder="Provide more details about the issue..."
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;