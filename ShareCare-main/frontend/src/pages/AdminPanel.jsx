import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import reportService from '../services/reportService';
import postService from '../services/postService';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import Navbar from '../components/Navbar';

export default function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchReports();
  }, [filter, user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReports({ status: filter });
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await reportService.updateReportStatus(reportId, status, reviewNotes);
      setReviewNotes('');
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      alert('Failed to update report status');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(postId);
      fetchReports();
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No {filter} reports found
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Reports</h2>
              {reports.map((report) => (
                <Card
                  key={report._id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedReport?._id === report._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-red-600">{report.reason}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Post: {report.post?.title || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      By: {report.reporter?.username || 'Unknown'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedReport && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Report Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Post Title</h3>
                      <p>{selectedReport.post?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Post Description</h3>
                      <p className="text-sm text-gray-700">
                        {selectedReport.post?.description || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Reason</h3>
                      <p className="text-red-600">{selectedReport.reason}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Description</h3>
                      <p className="text-sm">{selectedReport.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Reporter</h3>
                      <p>{selectedReport.reporter?.username || 'Unknown'} ({selectedReport.reporter?.email || 'N/A'})</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Review Notes</h3>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add review notes..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold mb-2">Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedReport._id, 'reviewed')}
                        >
                          Mark as Reviewed
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                        >
                          Resolve
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')}
                        >
                          Dismiss
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeletePost(selectedReport.post?._id)}
                        >
                          Delete Post
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
