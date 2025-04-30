import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getReportDetails, updateReportStatus } from "../../services/api";

const ReportDetail = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const fetchReportDetails = async () => {
      setLoading(true);
      const result = await getReportDetails(reportId);

      if (result.ok) {
        setReport(result.report);
        setNewStatus(result.report.status);
      } else {
        setError(result.error || "Failed to load report details");
      }
      setLoading(false);
    };

    fetchReportDetails();
  }, [reportId]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === report.status) return;

    const result = await updateReportStatus(reportId, newStatus);
    if (result.ok) {
      setReport({ ...report, status: newStatus });
    } else {
      setError(result.error || "Failed to update status");
    }
  };

  // Add handleViewDetails method to navigate to user details
  const handleViewDetails = (username) => {
    navigate(`/admin/users/${username}`);
  };

  // Add skeleton loader for better perceived performance
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-600 rounded w-1/4"></div>
          <div className="h-8 bg-gray-600 rounded w-24"></div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!report) return <div className="p-6">Report not found</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Report #{report._id}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
        >
          Back to Reports
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-gray-400 text-sm">Reported User</h3>
            <button
              onClick={() => handleViewDetails(report.reportedUser)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {report.reportedUser}
            </button>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Reported By</h3>
            <button
              onClick={() => handleViewDetails(report.reportedBy)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {report.reportedBy}
            </button>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Room ID</h3>
            <p>{report.roomId}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Date</h3>
            <p>{new Date(report.timestamp).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Reason</h3>
            <p>{report.reason}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Status</h3>
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={newStatus === report.status}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {report.additionalComments && (
          <div className="mb-6">
            <h3 className="text-gray-400 text-sm mb-2">Additional Comments</h3>
            <div className="bg-gray-700 rounded p-4">
              {report.additionalComments}
            </div>
          </div>
        )}

        {report.canvasData && (
          <div className="mb-6">
            <h3 className="text-gray-400 text-sm mb-2">Drawing Evidence</h3>
            <div className="bg-white rounded overflow-hidden">
              <img
                src={report.canvasData}
                alt="Drawing Evidence"
                className="w-full h-auto"
                style={{ maxHeight: "300px" }}
              />
            </div>
          </div>
        )}

        {report.chatLogs && report.chatLogs.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Chat Logs</h3>
            <div className="bg-gray-700 rounded p-4 max-h-64 overflow-y-auto">
              {report.chatLogs.map((message, index) => (
                <div key={index} className="mb-1">
                  <span className="text-blue-400">
                    <button
                      onClick={() => handleViewDetails(message.username)}
                      className="hover:underline"
                    >
                      {message.username}
                    </button>
                    :
                  </span>
                  <span className="ml-1 text-white">{message.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetail;
